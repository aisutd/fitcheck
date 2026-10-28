r"""Run: .venv\Scripts\python.exe -m unittest test_connection -v"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
import httpx
import pandas as pd
from io import BytesIO
from PIL import Image
from photo_store import PhotoStore

import server
from detection_runtime import ActivityModel, detector


class ConnectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='.tests-', dir=Path(__file__).resolve().parent)
        cls.model = ActivityModel(Path(cls.temp.name) / 'test.joblib')

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def setUp(self):
        self.block_delete = False
        self.database = patch.object(server, 'DB', Path(self.temp.name) / (self.id().split('.')[-1] + '.sqlite3'))
        self.database.start()
        self.model_patch = patch.object(server, 'ActivityModel', return_value=self.model)
        self.model_patch.start()
        self.client = TestClient(server.app)
        self.client.__enter__()
        self.upstream = server.app.state.http

        def respond(request):
            authorization = request.headers.get('authorization')
            if authorization not in ['Bearer alice', 'Bearer bob']:
                return httpx.Response(401, json={'message': 'bad token'})
            owner = authorization.split()[-1]
            if request.url.path == '/auth/v1/user':
                return httpx.Response(200, json={'id': owner})
            if request.method == 'DELETE' and self.block_delete:
                return httpx.Response(403, json={'message': 'permission denied'})
            # The gateway must forward the user's token, never a service key.
            self.assertEqual(request.headers['apikey'], server.PUBLISHABLE_KEY)
            return httpx.Response(200, json=[{'user_id': owner}])

        server.app.state.http = httpx.AsyncClient(transport=httpx.MockTransport(respond))

    def tearDown(self):
        replacement = server.app.state.http
        self.client.portal.call(replacement.aclose)
        server.app.state.http = self.upstream
        self.client.__exit__(None, None, None)
        self.model_patch.stop()
        self.database.stop()

    def test_invalid_session_rejected(self):
        self.assertEqual(self.client.get('/security/activity').status_code, 401)
        self.assertEqual(self.client.get('/rest/v1/privacy_settings', headers={'Authorization': 'Bearer invalid'}).status_code, 401)

    def test_verified_owner_logging_and_alert_isolation(self):
        response = self.client.get('/rest/v1/privacy_settings?account_id=bob', headers={'Authorization': 'Bearer alice'})
        self.assertEqual(response.status_code, 200)
        own = self.client.get('/security/activity', headers={'Authorization': 'Bearer alice'}).json()
        other = self.client.get('/security/activity', headers={'Authorization': 'Bearer bob'}).json()
        self.assertEqual(own['requests_last_5_minutes'], 1)
        self.assertEqual(other['requests_last_5_minutes'], 0)
        with server.connect() as db:
            db.execute('insert into alerts values (?,?,?,?,?)', ('alice', datetime.now(timezone.utc).isoformat(), -0.8, -0.6, 100))
        self.assertEqual(len(self.client.get('/security/activity', headers={'Authorization': 'Bearer alice'}).json()['alerts']), 1)
        self.assertEqual(self.client.get('/security/activity', headers={'Authorization': 'Bearer bob'}).json()['alerts'], [])

    def test_cors_and_unknown_route(self):
        response = self.client.options('/rest/v1/privacy_settings', headers={
            'Origin': 'http://localhost:8082', 'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization,accept-profile,x-client-info'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get('/rest/v1/other_table').status_code, 404)

    def test_real_model_scores_burst(self):
        start = pd.Timestamp.now(tz='UTC').floor('5min')
        events = [{'account_id': 'alice', 'timestamp': (start + pd.Timedelta(seconds=index % 60)).isoformat(),
            'endpoint': 'GET:privacy_settings', 'status': 200, 'is_login_failure': False}
            for index in range(1000)]
        self.assertTrue(self.model.score(events)[0]['suspicious'])

    def test_delete_all_removes_owned_files_and_activity(self):
        content = BytesIO()
        Image.new('RGB', (40, 60), 'blue').save(content, format='PNG')
        row = server.app.state.photos.create('alice', content.getvalue(), 'bodyPhotos', {'photo_retention': 'Keep until I delete'})
        self.client.get('/rest/v1/privacy_settings', headers={'Authorization': 'Bearer alice'})
        response = self.client.delete('/privacy/data', headers={'Authorization': 'Bearer alice'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(server.app.state.photos.list('alice'), [])
        self.assertFalse(server.app.state.photos.path(row['id'], '.original').exists())
        self.assertFalse(server.app.state.photos.path(row['id'], '.png').exists())
        own = self.client.get('/security/activity', headers={'Authorization': 'Bearer alice'}).json()
        self.assertEqual(own['requests_last_5_minutes'], 0)

    def test_delete_all_reports_permission_failure(self):
        self.block_delete = True
        content = BytesIO()
        Image.new('RGB', (40, 60), 'blue').save(content, format='PNG')
        server.app.state.photos.create('alice', content.getvalue(), 'bodyPhotos', {'photo_retention': 'Keep until I delete'})
        response = self.client.delete('/privacy/data', headers={'Authorization': 'Bearer alice'})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(len(server.app.state.photos.list('alice')), 1)


class SimulationTests(unittest.TestCase):
    def test_no_bursts_and_utc_features(self):
        events, labels = detector.simulate_events(n_accounts=3, days=1, burst_accounts_frac=0, seed=1)
        self.assertEqual(len(labels), 0)
        self.assertEqual(str(detector.build_features(events)['window'].dt.tz), 'UTC')

    def test_boundary_windows_match_requests(self):
        rows = pd.DataFrame([{'account_id': 'a', 'timestamp': stamp, 'endpoint': '/settings',
            'status': 200, 'is_login_failure': False} for stamp in ['2026-01-01T00:04:59Z', '2026-01-01T00:05:01Z']])
        self.assertEqual(len(detector.build_features(rows)), 2)


class PhotoTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='.tests-', dir=Path(__file__).resolve().parent)
        folder = Path(self.temp.name)
        self.store = PhotoStore(folder / 'test.sqlite3', folder / 'photos')
        content = BytesIO()
        Image.new('RGB', (60, 80), 'red').save(content, format='PNG')
        self.image = content.getvalue()

    def tearDown(self):
        self.temp.cleanup()

    def test_processed_original_physically_removed(self):
        row = self.store.create('alice', self.image, 'bodyPhotos', {'photo_retention': 'After processing'})
        self.assertEqual(row['original_present'], 0)
        self.assertFalse(self.store.path(row['id'], '.original').exists())
        self.assertTrue(self.store.path(row['id'], '.png').exists())
        preview = Image.open(BytesIO(self.store.preview('alice', row['id'])))
        self.assertEqual(len(preview.getexif()), 0)
        self.assertNotEqual(preview.getpixel((0, 0)), (255, 0, 0))

    def test_timed_cleanup_even_without_client(self):
        row = self.store.create('alice', self.image, 'bodyPhotos', {'photo_retention': 'After 24 hours'})
        self.assertTrue(self.store.path(row['id'], '.original').exists())
        self.assertEqual(self.store.expire(datetime.now(timezone.utc) + timedelta(hours=25)), 1)
        self.assertFalse(self.store.path(row['id'], '.original').exists())

    def test_manual_retention_and_owner_boundary(self):
        row = self.store.create('alice', self.image, 'closet', {'photo_retention': 'Keep until I delete'})
        self.assertEqual(self.store.expire(datetime.now(timezone.utc) + timedelta(days=3)), 0)
        self.assertEqual(self.store.list('bob'), [])
        with self.assertRaises(FileNotFoundError): self.store.preview('bob', row['id'])
        self.assertEqual(self.store.delete('bob', row['id']), 0)
        self.assertTrue(self.store.path(row['id'], '.original').exists())
        self.assertEqual(self.store.delete('alice', row['id']), 1)
        self.assertEqual(list(self.store.folder.iterdir()), [])

    def test_retention_change_applies_to_existing_original(self):
        row = self.store.create('alice', self.image, 'bodyPhotos', {'photo_retention': 'Keep until I delete'})
        self.store.apply_retention('alice', 'After processing')
        self.assertFalse(self.store.path(row['id'], '.original').exists())

    def test_invalid_upload_rejected(self):
        with self.assertRaises(ValueError): self.store.create('alice', b'not an image', 'bodyPhotos', {})
        self.assertEqual(self.store.list('alice'), [])

    def test_failed_deletion_keeps_retryable_metadata(self):
        row = self.store.create('alice', self.image, 'bodyPhotos', {'photo_retention': 'Keep until I delete'})
        with patch.object(Path, 'unlink', side_effect=OSError('blocked')):
            with self.assertRaises(OSError): self.store.delete('alice', row['id'])
        self.assertEqual(len(self.store.list('alice')), 1)


if __name__ == '__main__':
    unittest.main()
