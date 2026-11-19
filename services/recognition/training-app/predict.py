"""Run a saved training-app classifier on one image."""
import argparse
from pathlib import Path

import joblib
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from embedding_utils import normalized_image_features


FIELDS = ("item", "category", "color", "design", "material", "fit")

CATEGORIES = ("Tops", "Bottoms", "Dresses", "Outerwear", "Suits", "Shoes")

MODEL_NAME = "patrickjohncyh/fashion-clip"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--field", choices=FIELDS, help="Classifier field (defaults to item)")
    parser.add_argument("--classifier", type=Path, help="Override the selected classifier path")
    args = parser.parse_args()

    classifier_path = args.classifier or Path(__file__).resolve().parent / "models" / f"{args.field or 'item'}_classifier.joblib"
    bundle = joblib.load(classifier_path)
    if bundle.get("field") not in FIELDS:
        parser.error("Classifier field is not supported; choose item, category, color, design, material, or fit")
    if bundle["field"] == "category" and any(label not in CATEGORIES for label in bundle["classifier"].classes_):
        parser.error("Classifier contains unsupported categories; Accessories is excluded")
    if args.field and bundle["field"] != args.field:
        parser.error("--field does not match the selected classifier")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    image = Image.open(args.image).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        embedding = normalized_image_features(model, inputs)
    classifier = bundle["classifier"]
    label = classifier.predict(embedding.cpu().numpy())[0]
    confidence = classifier.predict_proba(embedding.cpu().numpy())[0].max()
    print(f"{bundle['field']}: {label} (classifier score {confidence:.1%})")


if __name__ == "__main__":
    main()
