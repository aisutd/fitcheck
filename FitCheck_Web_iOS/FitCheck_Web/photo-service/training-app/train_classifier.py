"""Train a small label classifier on frozen FashionCLIP image embeddings.

Fill in labels.jsonl first. This trains an item classifier by default, and
supports separate item, category, color, design, material, and fit classifiers.
"""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import torch
from PIL import Image
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from transformers import CLIPModel, CLIPProcessor
from embedding_utils import normalized_image_features


ROOT = Path(__file__).resolve().parent
PHOTO_DIR = ROOT / "photos"
LABELS_FILE = ROOT / "labels.jsonl"
OUTPUT_DIR = ROOT / "models"
MODEL_NAME = "patrickjohncyh/fashion-clip"
FIELDS = ("item", "category", "color", "design", "material", "fit")
CATEGORIES = ("Tops", "Bottoms", "Dresses", "Outerwear", "Suits", "Shoes")


def load_records(field):
    if field not in FIELDS:
        raise ValueError(f"Unsupported training field: {field}")
    records = []
    for line_number, line in enumerate(LABELS_FILE.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        row = json.loads(line)
        category = row.get("category")
        if category is not None and (not isinstance(category, str) or (category.strip() and category.strip() not in CATEGORIES)):
            raise ValueError(f"Line {line_number}: unsupported category {category!r}; Accessories is excluded")
        value = row.get(field)
        if value is None:
            continue
        if not isinstance(value, str):
            raise ValueError(f"Line {line_number}: {field} must be a string or null")
        label = value.strip()
        if label:
            image_path = (PHOTO_DIR / row["filename"]).resolve()
            if not image_path.is_relative_to(PHOTO_DIR.resolve()):
                raise ValueError(f"Line {line_number}: filename must refer to a file inside photos/")
            if not image_path.is_file():
                raise FileNotFoundError(f"Line {line_number}: photo not found: {image_path}")
            records.append((image_path, label))
    if not records:
        raise ValueError(f"No labeled photos found. Fill the '{field}' value in {LABELS_FILE}.")
    return records


def image_embeddings(records):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading {MODEL_NAME} on {device}...")
    model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()

    vectors = []
    with torch.no_grad():
        for index, (path, _) in enumerate(records, 1):
            image = Image.open(path).convert("RGB")
            inputs = processor(images=image, return_tensors="pt").to(device)
            embedding = normalized_image_features(model, inputs)
            vectors.append(embedding[0].cpu().numpy())
            print(f"Embedded {index}/{len(records)}: {path.name}")
    return np.asarray(vectors, dtype=np.float32)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--field", choices=FIELDS, default="item")
    parser.add_argument("--output", default=None, help="Optional classifier output path")
    args = parser.parse_args()

    records = load_records(args.field)
    labels = np.asarray([label for _, label in records])
    classes, counts = np.unique(labels, return_counts=True)
    if len(classes) < 2:
        raise ValueError("At least two different labels are required to train a classifier.")
    if counts.min() < 2:
        rare = classes[counts < 2].tolist()
        raise ValueError(f"Each label needs at least two photos for evaluation; add examples for: {rare}")

    indices = np.arange(len(labels))
    try:
        train_idx, test_idx = train_test_split(
            indices, test_size=0.25, random_state=42, stratify=labels
        )
    except ValueError as error:
        minimum_total = max(4 * len(classes) - 3, 2 * len(classes))
        raise ValueError(
            f"There are {len(labels)} labeled photos across {len(classes)} {args.field} labels, "
            "which is too few for the 25% stratified holdout. "
            f"At least {minimum_total} photos are needed to include every label in the holdout; "
            "add more varied examples before training."
        ) from error

    features = image_embeddings(records)

    evaluation_model = LogisticRegression(max_iter=2000, class_weight="balanced")
    evaluation_model.fit(features[train_idx], labels[train_idx])
    predictions = evaluation_model.predict(features[test_idx])
    print("\nHoldout evaluation (photos not used to fit this evaluation model):")
    print(f"Accuracy: {accuracy_score(labels[test_idx], predictions):.1%}")
    print(classification_report(labels[test_idx], predictions, zero_division=0))

    # Refit on every labeled example after measuring holdout performance.
    final_model = LogisticRegression(max_iter=2000, class_weight="balanced")
    final_model.fit(features, labels)
    output_path = Path(args.output) if args.output else OUTPUT_DIR / f"{args.field}_classifier.joblib"
    if not output_path.is_absolute():
        output_path = ROOT / output_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"field": args.field, "embedding_model": MODEL_NAME, "classifier": final_model}, output_path)
    print(f"Saved classifier: {output_path}")


if __name__ == "__main__":
    main()
