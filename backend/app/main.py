from fastapi import FastAPI
from app.routes.tryon import router as tryon_router

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tryon_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Digital Stylist backend is running!"
    }

