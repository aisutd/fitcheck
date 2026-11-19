"""Private local photo storage. No upload directory is exposed as static content."""
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
import sqlite3
import uuid
import warnings
from contextlib import contextmanager

from PIL import Image, ImageDraw, ImageOps

Image.MAX_IMAGE_PIXELS = 20_000_000
CATEGORIES = ('bodyPhotos', 'tryOns', 'closet')


def utcnow():
    return datetime.now(timezone.utc)


class PhotoStore:
    def __init__(self, database, folder):
        self.database, self.folder = Path(database), Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('''create table if not exists photos (
              id text primary key, account_id text not null, category text not null,
              created_at text not null, expires_at text, original_present integer not null,
              preview_present integer not null, processing_mode text not null)''')
            db.execute('create index if not exists photo_owner on photos(account_id)')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def path(self, photo_id, suffix):
        # IDs are generated server-side; callers never supply file paths.
        return self.folder / (str(uuid.UUID(photo_id)) + suffix)

    def list(self, owner):
        with self.connect() as db:
            rows = db.execute('select id,category,created_at,expires_at,original_present,preview_present,processing_mode from photos where account_id=? order by created_at desc', (owner,)).fetchall()
        return [dict(row) for row in rows]

    def create(self, owner, content, category, settings):
        if category not in CATEGORIES:
            raise ValueError('Choose bodyPhotos, tryOns, or closet.')
        if not content or len(content) > 8 * 1024 * 1024:
            raise ValueError('Choose a JPEG or PNG smaller than 8 MB.')
        try:
            with warnings.catch_warnings():
                warnings.simplefilter('error', Image.DecompressionBombWarning)
                source = Image.open(BytesIO(content))
                if source.format not in ('JPEG', 'PNG'):
                    raise ValueError('Only JPEG and PNG images are supported.')
                source.load()
                image = ImageOps.exif_transpose(source).convert('RGB')
        except (OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
            raise ValueError('This image is invalid or too large.') from error

        photo_id = str(uuid.uuid4())
        original, preview = self.path(photo_id, '.original'), self.path(photo_id, '.png')
        created = utcnow()
        retention = settings.get('photo_retention', 'After processing')
        # Failed processing never leaves an indefinitely retained original.
        failure_deadline = (created + timedelta(hours=1)).isoformat()
        with self.connect() as db:
            db.execute('insert into photos values (?,?,?,?,?,?,?,?)',
                (photo_id, owner, category, created.isoformat(), failure_deadline, 1, 0, 'processing'))
        try:
            original.write_bytes(content)
            image.thumbnail((768, 768))
            # Conservative protection: if protection is requested, expose no
            # original pixels. This is a generic privacy preview, not try-on AI
            # or a selective face/background segmentation claim.
            protected = settings.get('private_mirror', True) or settings.get('blur_faces', True) or settings.get('blur_background', True)
            if protected:
                image = Image.new('RGB', (320, 400), '#eee8fa')
                draw = ImageDraw.Draw(image)
                draw.ellipse((120, 50, 200, 130), fill='#9765e0')
                draw.rounded_rectangle((80, 145, 240, 330), radius=60, fill='#534fa5')
                mode = 'generic protected preview'
            else:
                mode = 'resized photo'
            # Re-encoding deliberately drops EXIF/location metadata. No provider
            # receives original pixels, and there is no training dataset copy.
            image.save(preview, format='PNG')
            expiry = None if retention == 'Keep until I delete' else (
                created + timedelta(hours=24) if retention == 'After 24 hours' else created).isoformat()
            with self.connect() as db:
                db.execute('update photos set preview_present=1, processing_mode=?, expires_at=? where id=?', (mode, expiry, photo_id))
            if retention == 'After processing':
                self.delete_original(photo_id)
        except Exception:
            # Preserve retryable metadata if a filesystem deletion fails.
            with self.connect() as db:
                db.execute("update photos set processing_mode='processing failed; cleanup pending' where id=?", (photo_id,))
            raise
        return next(row for row in self.list(owner) if row['id'] == photo_id)

    def delete_original(self, photo_id):
        self.path(photo_id, '.original').unlink(missing_ok=True)
        with self.connect() as db:
            db.execute('update photos set original_present=0, expires_at=null where id=?', (photo_id,))

    def expire(self, now=None):
        with self.connect() as db:
            rows = db.execute('select id from photos where original_present=1 and expires_at is not null and expires_at<=?', ((now or utcnow()).isoformat(),)).fetchall()
        for row in rows:
            self.delete_original(row['id'])
        return len(rows)

    def apply_retention(self, owner, retention):
        with self.connect() as db:
            rows = db.execute('select id,created_at from photos where account_id=? and original_present=1 and preview_present=1', (owner,)).fetchall()
            for row in rows:
                deadline = None if retention == 'Keep until I delete' else (
                    datetime.fromisoformat(row['created_at']) + timedelta(hours=24)
                    if retention == 'After 24 hours' else utcnow()).isoformat()
                db.execute('update photos set expires_at=? where id=?', (deadline, row['id']))
        self.expire()

    def preview(self, owner, photo_id):
        with self.connect() as db:
            row = db.execute('select preview_present from photos where id=? and account_id=?', (photo_id, owner)).fetchone()
        if not row or not row['preview_present']:
            raise FileNotFoundError('Photo not found.')
        return self.path(photo_id, '.png').read_bytes()

    def delete(self, owner, photo_id=None, category=None):
        query, args = 'select id from photos where account_id=?', [owner]
        if photo_id:
            query += ' and id=?'; args.append(photo_id)
        if category:
            query += ' and category=?'; args.append(category)
        with self.connect() as db:
            rows = db.execute(query, args).fetchall()
        for row in rows:
            self.path(row['id'], '.original').unlink(missing_ok=True)
            self.path(row['id'], '.png').unlink(missing_ok=True)
            with self.connect() as db:
                db.execute('delete from photos where id=? and account_id=?', (row['id'], owner))
        return len(rows)
