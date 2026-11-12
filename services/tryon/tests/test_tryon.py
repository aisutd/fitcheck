import importlib
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

route = importlib.import_module('app.routes.tryon')
client = TestClient(app)

def files():
    return {'person': ('person.png', b'person-image', 'image/png'), 'garment': ('garment.png', b'garment-image', 'image/png')}

def test_configuration_and_validation():
    with patch.object(route, 'MODEL_API_URL', None):
        assert client.post('/tryon', files=files()).status_code == 503
    invalid = files()
    invalid['person'] = ('text.txt', b'bad', 'text/plain')
    assert client.post('/tryon', files=invalid).status_code == 400
    assert client.get('/health').status_code == 200

def test_model_contract_and_image_response():
    original_client = httpx.AsyncClient
    result = b'\x89PNG\r\n\x1a\nimage-result'
    def respond(request):
        assert str(request.url) == 'https://model.example/generate'
        assert request.headers['X-API-Key'] == 'fixture'
        assert b'name="person"' in request.content and b'name="garment"' in request.content
        assert b'person-image' in request.content and b'garment-image' in request.content
        assert b'name="steps"' in request.content and b'30' in request.content
        return httpx.Response(200, content=result, headers={'content-type': 'image/png'})
    with patch.object(route, 'MODEL_API_URL', 'https://model.example'), patch.object(route, 'MODEL_API_KEY', 'fixture'), patch.object(route.httpx, 'AsyncClient', side_effect=lambda **kwargs: original_client(transport=httpx.MockTransport(respond), **kwargs)):
        response = client.post('/tryon', files=files())
        assert response.status_code == 200
        assert response.content == result

def test_provider_failure():
    original_client = httpx.AsyncClient
    with patch.object(route, 'MODEL_API_URL', 'https://model.example'), patch.object(route, 'MODEL_API_KEY', 'fixture'), patch.object(route.httpx, 'AsyncClient', side_effect=lambda **kwargs: original_client(transport=httpx.MockTransport(lambda request: httpx.Response(500)), **kwargs)):
        assert client.post('/tryon', files=files()).status_code == 502
