"""Small FastAPI backend: validate images, call IDM-VTON, return a PNG."""
from pathlib import Path
from concurrent.futures import TimeoutError
import os
import shutil
import tempfile
import warnings
from uuid import uuid4
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from gradio_client import Client, handle_file

class ProviderError(Exception):
    def __init__(self, message, status_code=503):
        super().__init__(message)
        self.status_code = status_code

MAX_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 20_000_000

class InvalidImage(ValueError):
    pass

def normalize_image(source, destination: Path, max_bytes: int = MAX_BYTES) -> None:
    """Decode actual content, strip metadata and normalize orientation without cropping."""
    source.seek(0, 2)
    size = source.tell()
    source.seek(0)
    if size == 0 or size > max_bytes:
        raise InvalidImage('Each image must be nonempty and no larger than 8 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(source) as image:
                if image.format not in {'JPEG', 'PNG', 'WEBP'}:
                    raise InvalidImage('Use a JPEG, PNG, or WebP image. Convert HEIC photos first.')
                if image.width * image.height > MAX_PIXELS:
                    raise InvalidImage('Each image must contain at most 20 megapixels.')
                image.load()
                normalized = ImageOps.exif_transpose(image).convert('RGB')
                normalized.thumbnail((2048, 2048))
                normalized.save(destination, format='PNG')
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise InvalidImage('The image is corrupt or cannot be decoded.') from exc

PARAMETERS = ['dict', 'garm_img', 'garment_des', 'is_checked', 'is_checked_crop', 'denoise_steps', 'seed']

def verify_api(api: dict) -> None:
    endpoint = api.get('named_endpoints', {}).get('/tryon', {})
    parameters = endpoint.get('parameters', [])
    names = [item.get('parameter_name') for item in parameters]
    components = [item.get('component', '').lower() for item in parameters]
    returns = endpoint.get('returns', [])
    if names != PARAMETERS or components != ['imageeditor', 'image', 'textbox', 'checkbox', 'checkbox', 'number', 'number'] or len(returns) != 2 or returns[0].get('component', '').lower() != 'image':
        raise ProviderError('The IDM-VTON demo API has changed and is incompatible. Check the current Space API before updating the backend.', 503)


def generate_tryon(person: Path, garment: Path, description: str, workspace: Path) -> Path:
    client, job = None, None
    download_dir = workspace / 'provider-output'
    download_dir.mkdir()
    try:
        client = Client(os.getenv('HF_SPACE', 'yisol/IDM-VTON'), token=os.getenv('HF_TOKEN') or None, verbose=False, download_files=download_dir, max_workers=1, httpx_kwargs={'timeout': 30.0}, analytics_enabled=False)
        # Fail closed before uploading photos if the upstream contract drifts.
        verify_api(client.view_api(return_format='dict', print_info=False))
        job = client.submit(
            dict={'background': handle_file(str(person)), 'layers': [], 'composite': None},
            garm_img=handle_file(str(garment)), garment_des=description,
            is_checked=True, is_checked_crop=False, denoise_steps=30, seed=42,
            api_name='/tryon',
        )
        result = job.result(timeout=float(os.getenv('INFERENCE_TIMEOUT_SECONDS', '180')))
        if not isinstance(result, (tuple, list)) or len(result) != 2:
            raise ProviderError('IDM-VTON returned an unexpected response.', 502)
        generated = result[0]
        if isinstance(generated, dict):
            generated = generated.get('path')
        if not isinstance(generated, (str, Path)):
            raise ProviderError('IDM-VTON did not return a generated image.', 502)
        path = Path(generated).resolve()
        if not path.is_relative_to(download_dir.resolve()) or not path.is_file():
            raise ProviderError('IDM-VTON did not return a downloadable image.', 502)
        return path
    except TimeoutError as exc:
        if job is not None:
            # Cancel is best effort remotely. Clean up again after any late local download.
            try:
                job.cancel()
            except Exception:
                pass
            job.add_done_callback(lambda _: shutil.rmtree(workspace, ignore_errors=True))
        raise ProviderError('IDM-VTON timed out. The public demo may be busy; please try again later.', 504) from exc
    except ProviderError:
        raise
    except Exception as exc:
        text = str(exc).lower()
        if any(word in text for word in ['quota', 'rate limit', 'too many requests', '429', 'gpu duration']):
            raise ProviderError('The Hugging Face demo has reached its usage or GPU quota. Please try again later.', 429) from exc
        if any(word in text for word in ['401', '403', 'unauthorized', 'authentication', 'forbidden']):
            raise ProviderError('Hugging Face requires access credentials. Configure HF_TOKEN on the backend or check demo access.', 503) from exc
        raise ProviderError('The public IDM-VTON demo is unavailable or rejected the request. Please try again later.', 503) from exc
    finally:
        if client is not None:
            client.close()

app = FastAPI(title='FitCheck prototype')
app.add_middleware(CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:8081,http://localhost:8085').split(','),
    allow_methods=['GET', 'POST'], allow_headers=['Content-Type'])

@app.get('/health')
def health():
    return {'status': 'ok'}

@app.post('/tryon')
def tryon(user_photo: UploadFile = File(...), garment_photo: UploadFile = File(...),
          garment_description: str = Form('', max_length=500)):
    request_id = uuid4().hex
    try:
        # Every request has its own folder; it is removed on success or failure.
        with tempfile.TemporaryDirectory(prefix='tryon-') as folder:
            work = Path(folder)
            person, garment = work / 'person.png', work / 'garment.png'
            normalize_image(user_photo.file, person)
            normalize_image(garment_photo.file, garment)
            output = generate_tryon(person, garment, garment_description.strip() or 'a clothing item', work)
            result = work / f'{request_id}.png'
            try:
                with output.open('rb') as source:
                    normalize_image(source, result, max_bytes=16 * 1024 * 1024)
            except InvalidImage as exc:
                raise ProviderError('The provider returned an invalid image.', 502) from exc
            # Read before leaving the temporary folder, so cleanup is immediate.
            return Response(result.read_bytes(), media_type='image/png', headers={
                'Content-Disposition': f'inline; filename="tryon-{request_id}.png"',
                'Cache-Control': 'no-store',
            })
    except InvalidImage as exc:
        raise HTTPException(422, str(exc)) from exc
    except ProviderError as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc
    except Exception:
        raise HTTPException(500, 'Try-on failed. Please try again.') from None
    finally:
        user_photo.file.close()
        garment_photo.file.close()
