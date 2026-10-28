# Added for the "Recognize Clothes (Closet) + Add an Item" feature.
# Wraps Hugging Face's FashionCLIP (patrickjohncyh/fashion-clip - a CLIP
# variant fine-tuned on fashion imagery) to answer the requirement doc's
# "backend goal": take a photo in, return category/color/material/design
# out, callable on its own with no dependency on fitcheck's UI. server.py's
# /tag route (added alongside this file) is the only caller inside this
# app, but tag_image() works standalone - see the __main__ block at the
# bottom for a no-Flask-needed smoke test.
# #
# Optional supervised attribute heads use this same encoder; see classifiers.py.
import os
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
import torch
from fashion_labels import (
    ITEM_TO_CATEGORY,
    fit_labels_for_category,
    COLOR_LABELS,
    DESIGN_LABELS,
    MATERIAL_LABELS,
    basic_prompt,
    combo_prompt,
)
MODEL_NAME = os.environ.get("FASHIONCLIP_MODEL_PATH", "patrickjohncyh/fashion-clip")
# Loaded once at import time (not per-request) since both the weights and
# moving them onto whatever device is available are expensive - repeating
# that on every /tag call would make each request noticeably slower for no
# benefit, since the model is stateless across requests.
_model = None
_processor = None

# def _load_model():
#     global _model, _processor
#     if _model is not None:
#         return
#     raise NotImplementedError(
#     "transformers/torch are not installed yet and the model weights "
#     "haven't been downloaded in this environment (see module docstring "
#     "above) - this is a placeholder for the real "
#     "CLIPModel.from_pretrained(MODEL_NAME) / "
#     "CLIPProcessor.from_pretrained(MODEL_NAME) calls."
#     )
#     # _model = CLIPModel.from_pretrained(MODEL_NAME)
#     # _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
#     # _model.eval()

def _load_model():
    global _model, _processor
    if _model is None:
        _model = CLIPModel.from_pretrained(MODEL_NAME)
        _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        _model.eval()
    return _model, _processor

# Runs one zero-shot classification pass: scores `image` against every
# string in `candidate_prompts` and returns the winning original label
# (not the prompt sentence itself) plus its confidence score. Shared by
# every field's pass in tag_image() below instead of duplicating the
# processor/model-call boilerplate four times.
# def _best_match(image, labels, prompts):
#     _load_model()
#     inputs = _processor(text=prompts, images=image, return_tensors="pt", padding=True)
#     # with torch.no_grad():
#     # outputs = _model(inputs)
#     # # image-text similarity logits -> softmax turns them into a
#     # # probability distribution over our candidate prompts so the
#     # # returned score is interpretable as "confidence", not a raw logit.
#     # probs = outputs.logits_per_image.softmax(dim=1)[0]
#     # best_idx = int(probs.argmax())
#     # return labels[best_idx], float(probs[best_idx])
#     raise NotImplementedError

def _best_match(image, labels, prompts):
    model, processor = _load_model()

    inputs = processor(
        text=prompts,
        images=image,
        return_tensors="pt",
        padding=True
    )

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits_per_image
        probs = logits.softmax(dim=1)[0]

    best_idx = int(probs.argmax())
    return labels[best_idx], float(probs[best_idx].item())

# Main entry point - the requirement doc's "function that takes a photo in
# and returns category/color/occasion out". "Occasion" in the requirement
# doc maps to fitcheck's closest existing fields (category/color/design/
# material), since fitcheck's Add form has no separate "occasion" field to
# fill.
# #
# Two-pass approach (this is the "enhance" step from the requirement doc,
# step 4 - comparing against a naive single-pass baseline is exactly the
# before/after the eval script in eval_accuracy.py measures):
# 1. Basic pass - classify each field independently using plain
# per-field prompts (basic_prompt()), e.g. "a photo of a red piece of
# clothing" for color.
# 2. Combo pass - re-run the category classification using richer
# prompts that fold in the color/material already guessed in pass 1
# (combo_prompt()), e.g. "a photo of a red cotton dress" instead of
# just "a photo of a dress" - giving CLIP more context than a bare
# category name carries on its own.
# Color/material/design keep their pass-1 answer; only category gets the
# combo re-score, since category is the field most likely to benefit from
# extra context (e.g. distinguishing a dress from a skirt is easier once
# "red" and "cotton" are already known) while re-combining a guessed color
# into the color prompt itself would be circular.
def tag_image(image):
    # Preserve the CLIP model/processor and zero-shot implementation. Trained
    # heads are optional; each missing head falls back to the same CLIP scorer.
    from classifiers import AttributePredictor
    from fashion_labels import FIELDS

    def fallback(field, labels):
        if field in ('item', 'category'):
            prompts = [basic_prompt(label, 'category') for label in labels]
        elif field in ('color', 'design', 'material'):
            prompts = [basic_prompt(label, field) for label in labels]
        else:
            prompts = [f"a photo of {label.lower()} {field} clothing" for label in labels]
        return _best_match(image, labels, prompts)

    result = AttributePredictor(model_name=MODEL_NAME).predict(image, FIELDS, fallback=fallback)
    return result




# Lets this file be smoke-tested directly - `python3 fashion_tagger.py
# path/to/photo.jpg` - without needing server.py/Flask running, matching
# the requirement doc's "someone could call your function right now with a
# test photo and get a real answer back" bar.
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("usage: python3 fashion_tagger.py <path-to-image>")
        raise SystemExit(1)
    # image = Image.open(sys.argv[1]).convert("RGB")
    # print(tag_image(image))
    print("Placeholder only - see module docstring: model weights/deps not available yet.")