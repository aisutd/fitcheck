import io
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from PIL import Image
import remote_images


class RemoteImageTests(unittest.TestCase):
    def test_blocks_local_addresses_and_non_http(self):
        for url in ['file:///etc/passwd', 'http://127.0.0.1/image.jpg', 'http://[::1]/image.jpg']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                remote_images.validate_url(url)

    def test_decodes_content_instead_of_relying_on_extension(self):
        image = io.BytesIO()
        Image.new('RGB', (10, 10), 'blue').save(image, format='PNG')
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = image.getvalue()
        with patch.object(remote_images, 'validate_url'), patch.object(remote_images, 'build_opener', return_value=opener):
            result = remote_images.download_image('https://example.com/image.jpg')
        with Image.open(io.BytesIO(result)) as decoded:
            self.assertEqual(decoded.format, 'JPEG')
            self.assertEqual(decoded.size, (10, 10))

    def test_rejects_html_and_oversized_downloads(self):
        for data in [b'<html>product page</html>', b'x' * (remote_images.MAX_BYTES + 1)]:
            opener = MagicMock()
            opener.open.return_value.__enter__.return_value.read.return_value = data
            with patch.object(remote_images, 'validate_url'), patch.object(remote_images, 'build_opener', return_value=opener), self.assertRaises(ValueError):
                remote_images.download_image('https://example.com/product')

    def test_redirect_targets_are_validated(self):
        with self.assertRaises(ValueError):
            remote_images.PublicRedirects().redirect_request(None, None, 302, '', {}, 'http://127.0.0.1/private')

    def test_import_route_saves_and_serves_image(self):
        with patch.dict(sys.modules, {'fashion_tagger': MagicMock()}):
            import server
        image = io.BytesIO()
        Image.new('RGB', (10, 10)).save(image, format='JPEG')
        with patch.object(server.fashion_tagger, 'tag_image', return_value={'category': 'Tops', 'material': 'Cotton'}), tempfile.TemporaryDirectory() as folder, patch.object(server, 'STORAGE_DIR', folder), patch.object(server, 'download_image', return_value=image.getvalue()):
            client = server.app.test_client()
            response = client.post('/photos/import', json={'url': 'https://example.com/shirt.jpg'})
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.get_json()['tags']['category'], 'Tops')
            filename = response.get_json()['filename']
            self.assertTrue(os.path.isfile(os.path.join(folder, filename)))
            with patch.object(server.fashion_tagger, 'tag_image', side_effect=RuntimeError('Model unavailable')):
                fallback = client.post('/photos/import', json={'url': 'https://example.com/socks.jpg'})
                self.assertEqual(fallback.status_code, 201)
                self.assertIsNone(fallback.get_json()['tags'])
                self.assertTrue(fallback.get_json()['tagging_error'])
            with client.get('/photos/' + filename) as saved:
                self.assertEqual(saved.data, image.getvalue())
            self.assertEqual(client.post('/photos/import', json={}).status_code, 400)
            self.assertEqual(client.post('/photos/import', json=[]).status_code, 400)
            with patch.object(server, 'download_image', side_effect=ValueError('Invalid image')):
                self.assertEqual(client.post('/photos/import', json={'url': 'bad'}).status_code, 400)


if __name__ == '__main__':
    unittest.main()
