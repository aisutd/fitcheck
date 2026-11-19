"""Download a public image URL and normalize its contents to JPEG."""
import io
import ipaddress
import socket
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 10 * 1024 * 1024


def validate_url(url):
    try:
        parts = urlsplit(url)
        if parts.scheme not in ('http', 'https') or not parts.hostname or parts.username or parts.password:
            raise ValueError('Use a public HTTP or HTTPS image link.')
        addresses = socket.getaddrinfo(parts.hostname, parts.port or (443 if parts.scheme == 'https' else 80), type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(entry[4][0]).is_global for entry in addresses):
            raise ValueError('Use a public image link, not a local network address.')
    except (OSError, ValueError) as error:
        if isinstance(error, ValueError):
            raise
        raise ValueError('The image website could not be reached.') from error
    return url


class PublicRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def download_image(url):
    validate_url(url)
    try:
        request = Request(url, headers={'User-Agent': 'FitCheck/1.0', 'Accept': 'image/*'})
        with build_opener(PublicRedirects()).open(request, timeout=15) as response:
            data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError('Choose an image smaller than 10 MB.')
        with Image.open(io.BytesIO(data)) as image:
            if image.width * image.height > 25_000_000:
                raise ValueError('Choose an image smaller than 25 megapixels.')
            output = io.BytesIO()
            ImageOps.exif_transpose(image).convert('RGB').save(output, format='JPEG', quality=90)
            return output.getvalue()
    except (UnidentifiedImageError, Image.DecompressionBombError) as error:
        raise ValueError('That link is not a supported image. Copy the image address, not the product page link.') from error
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        raise ValueError('Could not download this image. The website may block downloads; try another image link.') from error
