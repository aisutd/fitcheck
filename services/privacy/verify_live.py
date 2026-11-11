"""Optional live smoke test. Creates two anonymous TEST accounts, never touches existing accounts."""
import asyncio
from io import BytesIO
import os
from pathlib import Path
import httpx
from dotenv import load_dotenv
from PIL import Image

load_dotenv(Path(__file__).resolve().parent.parent / '.env.local')


async def main():
    url = os.environ['EXPO_PUBLIC_SUPABASE_URL']
    key = os.environ['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
    root = 'http://127.0.0.1:8000'
    async with httpx.AsyncClient(timeout=30) as client:
        users = []
        for _ in range(2):
            response = await client.post(url + '/auth/v1/signup', headers={'apikey': key},
                json={'data': {'purpose': 'privacy backend integration test'}})
            if response.status_code != 200:
                raise RuntimeError('Test sign-in failed: ' + str(response.status_code))
            users.append(response.json())
        alice, bob = users
        ah = {'Authorization': 'Bearer ' + alice['access_token']}
        bh = {'Authorization': 'Bearer ' + bob['access_token']}
        response = await client.post(root + '/rest/v1/privacy_settings',
            headers={**ah, 'Prefer': 'resolution=merge-duplicates,return=representation'},
            json={'user_id': alice['user']['id'], 'closet_visibility': 'Private',
                'photo_retention': 'After processing', 'saved_memory': {'style': 'Integration test', 'size': 'M', 'budget': '20'}})
        if response.status_code >= 400:
            raise RuntimeError('Database setup incomplete or backend unavailable: ' + response.text[:200])
        image = BytesIO()
        Image.new('RGB', (40, 60), 'blue').save(image, format='PNG')
        response = await client.post(root + '/privacy/photos', headers=ah, content=image.getvalue())
        if response.status_code >= 400:
            raise RuntimeError('Upload failed: ' + response.text[:200])
        photo = response.json()
        assert photo['original_present'] == 0
        preview = root + '/privacy/photos/' + photo['id'] + '/preview'
        assert (await client.get(preview, headers=bh)).status_code == 404
        assert (await client.get(preview, headers=ah)).status_code == 200
        response = await client.get(root + '/rest/v1/privacy_settings', headers=bh,
            params={'user_id': 'eq.' + alice['user']['id']})
        assert response.json() == []
        response = await client.get(root + '/privacy/export', headers=ah)
        assert response.status_code == 200 and response.content[:2] == b'PK'
        for _ in range(8):
            responses = await asyncio.gather(*[client.get(root + '/rest/v1/privacy_settings', headers=ah,
                params={'select': 'user_id', 'limit': '1'}) for _ in range(10)])
            assert all(response.status_code == 200 for response in responses)
        activity = (await client.get(root + '/security/activity', headers=ah)).json()
        assert activity['alerts'], 'Burst did not produce an alert'
        assert not (await client.get(root + '/security/activity', headers=bh)).json()['alerts']
        response = await client.delete(root + '/privacy/categories/bodyPhotos', headers=ah)
        assert response.status_code == 200
        assert (await client.get(root + '/privacy/photos', headers=ah)).json()['photos'] == []
        print('LIVE PASS: settings, photo processing/deletion, two-account isolation, ZIP export, ML burst alert, category deletion.')
        response = await client.delete(root + '/privacy/data', headers=ah)
        if response.status_code != 200:
            print('REQUIRED: run supabase/SETUP_ALL.sql. Owner-only DELETE permission is not available yet.')
        else:
            assert (await client.get(root + '/rest/v1/privacy_settings', headers=ah)).json() == []
            print('LIVE PASS: Delete All removed saved settings.')
        print('Two anonymous test accounts were created. Existing users were not modified.')


if __name__ == '__main__':
    asyncio.run(main())
