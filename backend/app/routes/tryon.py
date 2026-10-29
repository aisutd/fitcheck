import os
import httpx

from dotenv import load_dotenv
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response

load_dotenv()

router = APIRouter()

COLAB_API_URL = os.getenv("COLAB_API_URL")
COLAB_API_KEY = os.getenv("COLAB_API_KEY")


@router.post("/tryon")
async def generate_tryon(
    person: UploadFile = File(...),
    garment: UploadFile = File(...),
):
    if person.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Invalid person image type")

    if garment.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Invalid garment image type")

    if not COLAB_API_URL or not COLAB_API_KEY:
        raise HTTPException(503, "Colab API is not configured")

    files = {
        "person": (
            person.filename or "person.jpg",
            await person.read(),
            person.content_type,
        ),
        "garment": (
            garment.filename or "garment.jpg",
            await garment.read(),
            garment.content_type,
        ),
    }

    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                f"{COLAB_API_URL.rstrip('/')}/generate",
                files=files,
                data={
                    "description": "a fitted spaghetti-strap tank top",
                    "steps": "30",
                    "seed": "42",
                },
                headers={
                    "X-API-Key": COLAB_API_KEY,
                },
            )

        response.raise_for_status()

    except httpx.TimeoutException:
        raise HTTPException(504, "Colab inference timed out")

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            502,
            f"Colab API returned status {exc.response.status_code}",
        )

    except httpx.RequestError:
        raise HTTPException(502, "Could not connect to Colab API")

    return Response(
        content=response.content,
        media_type="image/png",
    )