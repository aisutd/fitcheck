"""Stable paths shared by service scripts, independent of the working directory."""
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parent
TRAINING_DIR = SERVICE_DIR / 'training-app'
PHOTO_DIR = TRAINING_DIR / 'photos'
LABELS_FILE = TRAINING_DIR / 'labels.jsonl'
MODELS_DIR = TRAINING_DIR / 'models'
