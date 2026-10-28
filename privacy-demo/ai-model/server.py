"""Local development gateway: verified Supabase users, server logs, ML review flags."""
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
import sqlite3
import contextlib
import json
import logging
from io import BytesIO
import zipfile

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

from detection_runtime import ActivityModel
from photo_store import PhotoStore

HERE = Path(__file__).resolve().parent
load_dotenv(HERE.parent / '.env.local')
SUPABASE_URL = os.environ.get('EXPO_PUBLIC_SUPABASE_URL', '').rstrip('/')
PUBLISHABLE_KEY = os.environ.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
DB = Path(os.environ.get('ACTIVITY_DB_PATH', str(HERE.parents[2] / '.fitcheck-private' / 'activity.sqlite3')))


@contextlib.contextmanager
def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    try:
        with db:
            yield db
    finally:
        db.close()


def init_db():
    DB.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.executescript('''
          create table if not exists events (
            id integer primary key, account_id text not null,
            timestamp text not null, endpoint text not null, status integer not null
          );
          create index if not exists event_owner_time on events(account_id, timestamp);
          create table if not exists alerts (
            account_id text not null, window text not null, score real not null,
            threshold real not null, requests integer not null,
            primary key(account_id, window)
          );
        ''')


@asynccontextmanager
async def lifespan(app):
    if not SUPABASE_URL or not PUBLISHABLE_KEY:
        raise RuntimeError('Configure the Supabase URL and publishable key in ../.env.local.')
    init_db()
    app.state.photos = PhotoStore(DB, Path(os.environ.get('PHOTO_STORAGE_PATH', str(DB.parent / 'photos'))))
    app.state.owner_locks = {}
    app.state.cleanup_error = None
    app.state.model = await asyncio.to_thread(ActivityModel)
    async with httpx.AsyncClient(timeout=10) as client:
        app.state.http = client
        async def cleanup():
            while True:
                try:
                    await asyncio.to_thread(app.state.photos.expire)
                    app.state.cleanup_error = None
                except Exception:
                    app.state.cleanup_error = 'Photo cleanup needs attention; deletion will retry.'
                    logging.exception('Photo cleanup failed')
                await asyncio.sleep(15)
        worker = asyncio.create_task(cleanup())
        print('Activity gateway ready. Only routed privacy requests are monitored.', flush=True)
        try:
            yield
        finally:
            worker.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await worker


app = FastAPI(title='FitCheck activity gateway', lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=os.environ.get('APP_ORIGINS', 'http://localhost:8082,http://localhost:8081,http://127.0.0.1:8082').split(','),
    allow_methods=['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['*'],
    expose_headers=['content-range', 'preference-applied'])


async def verified_user(request: Request):
    authorization = request.headers.get('authorization', '')
    if not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Sign in to check account activity.')
    try:
        result = await request.app.state.http.get(f'{SUPABASE_URL}/auth/v1/user',
            headers={'apikey': PUBLISHABLE_KEY, 'Authorization': authorization})
    except httpx.RequestError:
        raise HTTPException(503, 'Could not verify your session. Try again.')
    if result.status_code != 200:
        raise HTTPException(401, 'Your session could not be verified.')
    user = result.json()
    if not user.get('id'):
        raise HTTPException(401, 'Your session could not be verified.')
    return user['id']


def record_event(user_id, endpoint, status, model):
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(minutes=5)).isoformat()
    with connect() as db:
        # Retain only seven days of metadata; no request bodies or credentials.
        oldest = (now - timedelta(days=7)).isoformat()
        db.execute('delete from events where timestamp < ?', (oldest,))
        db.execute('delete from alerts where window < ?', (oldest,))
        db.execute('insert into events(account_id,timestamp,endpoint,status) values (?,?,?,?)',
            (user_id, now.isoformat(), endpoint, status))
        rows = db.execute('select account_id,timestamp,endpoint,status from events where account_id=? and timestamp>=? order by timestamp',
            (user_id, cutoff)).fetchall()
        # Avoid scoring very small samples and run once per ten requests.
        if len(rows) < 20 or len(rows) % 10:
            return
        events = [dict(row, is_login_failure=False) for row in rows]
        for score in model.score(events):
            if score['suspicious'] and score['requests'] >= 20:
                db.execute('insert into alerts values (?,?,?,?,?) on conflict(account_id,window) do update set score=excluded.score,threshold=excluded.threshold,requests=excluded.requests',
                    (user_id, score['window'], score['score'], score['threshold'], score['requests']))


@app.get('/health')
async def health():
    return {'app': 'fitcheck-privacy', 'status': 'ready', 'model_training': 'synthetic-demo', 'photo_cleanup': app.state.cleanup_error or 'running'}


@app.api_route('/rest/v1/privacy_settings', methods=['GET', 'POST', 'PATCH'])
async def privacy_gateway(request: Request, user_id: str = Depends(verified_user)):
    async with owner_lock(user_id):
        body = await request.body()
        if len(body) > 262144:
            raise HTTPException(413, 'Request is too large.')
        headers = {'apikey': PUBLISHABLE_KEY, 'Authorization': request.headers['authorization']}
        for name in ['content-type', 'prefer', 'accept', 'range', 'range-unit']:
            if name in request.headers:
                headers[name] = request.headers[name]
        # Fixed upstream and table: callers cannot redirect us or provide an owner ID
        # for activity logs. Supabase RLS still controls all data access.
        try:
            result = await request.app.state.http.request(request.method,
                f'{SUPABASE_URL}/rest/v1/privacy_settings',
                params=list(request.query_params.multi_items()), content=body, headers=headers)
        except httpx.RequestError:
            await asyncio.to_thread(record_event, user_id, request.method + ':privacy_settings', 502, request.app.state.model)
            return Response('{"message":"Database connection failed. Try again."}', status_code=502, media_type='application/json')
        await asyncio.to_thread(record_event, user_id, request.method + ':privacy_settings', result.status_code, request.app.state.model)
        if result.is_success and request.method == 'PATCH':
            try:
                patch = json.loads(body)
                if 'photo_retention' in patch:
                    await asyncio.to_thread(request.app.state.photos.apply_retention, user_id, patch['photo_retention'])
            except (ValueError, OSError, sqlite3.Error):
                return Response('{"message":"Preference stored, but photo cleanup failed. Retry the change."}', status_code=503, media_type='application/json')
        forwarded = {key: value for key, value in result.headers.items()
            if key in ['content-type', 'content-range', 'preference-applied']}
        return Response(content=result.content, status_code=result.status_code, headers=forwarded)


@app.get('/security/activity')
async def activity(request: Request, user_id: str = Depends(verified_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    with connect() as db:
        total = db.execute('select count(*) from events where account_id=? and timestamp>=?', (user_id, cutoff)).fetchone()[0]
        alerts = db.execute('select window,score,threshold,requests from alerts where account_id=? order by window desc limit 10', (user_id,)).fetchall()
    return {'requests_last_5_minutes': total, 'alerts': [dict(row) for row in alerts],
        'model_training': 'synthetic-demo', 'scope': 'routed privacy settings and photo requests'}


def owner_lock(user_id):
    return app.state.owner_locks.setdefault(user_id, asyncio.Lock())


async def settings_request(request, user_id, method='GET', patch=None):
    headers = {'apikey': PUBLISHABLE_KEY, 'Authorization': request.headers['authorization'], 'Prefer': 'return=representation'}
    result = await request.app.state.http.request(method, f'{SUPABASE_URL}/rest/v1/privacy_settings',
        params={'user_id': 'eq.' + user_id}, headers=headers, json=patch)
    if not result.is_success:
        raise HTTPException(503, 'Could not update saved data. Check that the database setup SQL has been run, then retry.')
    rows = result.json() if result.content else []
    return rows[0] if rows else {}


@app.get('/privacy/photos')
async def photos(request: Request, user_id: str = Depends(verified_user)):
    return {'photos': await asyncio.to_thread(request.app.state.photos.list, user_id),
        'cleanup': request.app.state.cleanup_error}


@app.post('/privacy/photos')
async def upload_photo(request: Request, category: str = 'bodyPhotos', user_id: str = Depends(verified_user)):
    content = bytearray()
    async for chunk in request.stream():
        content.extend(chunk)
        if len(content) > 8 * 1024 * 1024:
            raise HTTPException(413, 'Choose an image smaller than 8 MB.')
    async with owner_lock(user_id):
        if len(await asyncio.to_thread(request.app.state.photos.list, user_id)) >= 50:
            raise HTTPException(409, 'Delete an existing photo before uploading more (50-photo limit).')
        settings = await settings_request(request, user_id)
        try:
            result = await asyncio.to_thread(request.app.state.photos.create, user_id, bytes(content), category, settings)
        except ValueError as error:
            raise HTTPException(400, str(error))
        await asyncio.to_thread(record_event, user_id, 'POST:photos', 201, request.app.state.model)
        return result


@app.get('/privacy/photos/{photo_id}/preview')
async def preview_photo(photo_id: str, request: Request, user_id: str = Depends(verified_user)):
    try:
        content = await asyncio.to_thread(request.app.state.photos.preview, user_id, photo_id)
    except (FileNotFoundError, ValueError):
        raise HTTPException(404, 'Photo not found.')
    await asyncio.to_thread(record_event, user_id, 'GET:photos', 200, request.app.state.model)
    return Response(content, media_type='image/png', headers={'Cache-Control': 'no-store'})


@app.delete('/privacy/photos/{photo_id}')
async def delete_photo(photo_id: str, request: Request, user_id: str = Depends(verified_user)):
    async with owner_lock(user_id):
        count = await asyncio.to_thread(request.app.state.photos.delete, user_id, photo_id)
    return {'deleted': count}


@app.delete('/privacy/categories/{category}')
async def delete_category(category: str, request: Request, user_id: str = Depends(verified_user)):
    if category not in ['bodyPhotos', 'tryOns', 'closet', 'chats']:
        raise HTTPException(400, 'Unknown category.')
    async with owner_lock(user_id):
        settings = await settings_request(request, user_id)
        records = settings.get('demo_records') or {key: [] for key in ['bodyPhotos', 'tryOns', 'closet', 'chats', 'outfits']}
        records[category] = []
        if category == 'closet':
            records['outfits'] = []
        # Remove real files first; keep retryable rows on filesystem failures.
        deleted = await asyncio.to_thread(request.app.state.photos.delete, user_id, category=category)
        if settings:
            await settings_request(request, user_id, 'PATCH', {'demo_records': records})
    return {'deleted_photos': deleted}


@app.delete('/privacy/data')
async def delete_data(request: Request, user_id: str = Depends(verified_user)):
    async with owner_lock(user_id):
        # A failed step reports failure. Retrying is safe. Keep the login account;
        # this endpoint deletes app data, not the user's authentication identity.
        await settings_request(request, user_id, 'DELETE')
        deleted = await asyncio.to_thread(request.app.state.photos.delete, user_id)
        with connect() as db:
            db.execute('delete from events where account_id=?', (user_id,))
            db.execute('delete from alerts where account_id=?', (user_id,))
    return {'deleted': True, 'photos_deleted': deleted, 'account_retained': True}


@app.get('/privacy/export')
async def export_data(request: Request, format: str = 'zip', user_id: str = Depends(verified_user)):
    async with owner_lock(user_id):
        settings = await settings_request(request, user_id)
        records = await asyncio.to_thread(request.app.state.photos.list, user_id)
        if format == 'json':
            return {'settings': settings, 'photos': records, 'note': 'Photo files are included in the browser ZIP export.'}
        archive = BytesIO()
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as zipped:
            zipped.writestr('settings.json', json.dumps(settings, indent=2))
            zipped.writestr('photos.json', json.dumps(records, indent=2))
            for row in records:
                for suffix, present in [('.original', row['original_present']), ('.png', row['preview_present'])]:
                    path = request.app.state.photos.path(row['id'], suffix)
                    if present and path.exists():
                        zipped.write(path, 'photos/' + path.name)
        return Response(archive.getvalue(), media_type='application/zip',
            headers={'Content-Disposition': 'attachment; filename="fitcheck-data.zip"', 'Cache-Control': 'no-store'})
