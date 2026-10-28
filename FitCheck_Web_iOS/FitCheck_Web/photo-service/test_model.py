from transformers import CLIPModel, CLIPProcessor

print("Loading model...")

model = CLIPModel.from_pretrained(
    "patrickjohncyh/fashion-clip"
)

processor = CLIPProcessor.from_pretrained(
    "patrickjohncyh/fashion-clip"
)

print("Model loaded successfully")