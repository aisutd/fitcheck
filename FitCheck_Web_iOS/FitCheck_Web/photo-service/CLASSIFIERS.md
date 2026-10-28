# Six attribute classifiers

This checkout originally had no project `train.py`, `predict.py`, or `labels.jsonl`.
The added JSONL trainer fits independent logistic regression heads over normalized
FashionCLIP image features. The original `train_categories.py` encoder fine-tuning
and CSV evaluation commands remain available. Classifier training does not change
the encoder or its weights.

## macOS setup and labels

From the repository root:

```sh
cd FitCheck_Web/photo-service
source .venv/bin/activate
python -m pip install -r requirements.txt
```

`training-app/labels.jsonl` contains the moved training app’s annotations. Add one JSON object per real image, with
an `image` path relative to the JSONL file, or a `filename` relative to its sibling `photos/` directory and any verified attributes:
`item`, `category`, `color`, `design`, `material`, `fit`.
Missing, null, empty and whitespace-only attributes are skipped independently.
Never derive labels from filenames. No sample clothing labels are supplied.

Use exact values in `fashion_labels.py`. Categories are Tops, Bottoms, Dresses,
Outerwear, Suits, Shoes. Accessories and the retired Hoodies/Socks categories are
rejected. `All` is a UI filter, never a training label. Category need not be entered
for a row to train another attribute; it is not manufactured from the item label.
Explicit item/category pairs must agree. Fit must match the category.
Blank attributes remain unlabeled. Retired Length and Rise keys in old JSONL
records are ignored rather than used for training; annotation records are retained.

Each trained field needs at least two labels and two independent images per label
for a stratified holdout. More varied, manually checked data is necessary for
useful accuracy. Duplicate decoded images are rejected. Keep alternate views,
crops and photos of the same garment together; use a separate untouched test set
for final evaluation. The automatic split detects exact duplicates, not related
products.

## Validate and train

```sh
python train.py --labels training-app/labels.jsonl --field all --check-data
python train.py --labels training-app/labels.jsonl --field color
python train.py --labels training-app/labels.jsonl --field all
```

Each successful field writes `training-app/models/{field}_classifier.joblib` and
`training-app/models/{field}_report.json`, reports holdout accuracy and a per-label
precision/recall/F1 report, and records train/holdout paths. Blank fields are
skipped. Fields lacking sufficient labels are reported as skipped and the command
exits nonzero, while other eligible fields can still train. No model is saved for
an ineligible field. Existing classifier files are protected; use `--output` with
a new directory for retraining. `--seed 42 --holdout 0.2` are the defaults.

The encoder defaults to `patrickjohncyh/fashion-clip`. To use an existing fine-tuned
encoder, set `FASHIONCLIP_MODEL_PATH` to its checkpoint directory **for both training
and prediction**. The classifier bundle records that identity and rejects a
mismatch. Do not change encoder checkpoint contents under an existing path after
training heads; retrain heads if encoder weights change.

## Test classifiers and API

```sh
python predict.py /absolute/path/to/photo.jpg --field color
python predict.py /absolute/path/to/photo.jpg --field all
python predict.py /absolute/path/to/photo.jpg --field fit --category Bottoms --item pants
python -m unittest test_attributes test_train_categories test_evaluate_tagger test_remote_images
python server.py
curl -F 'photo=@/absolute/path/to/photo.jpg' http://localhost:5050/tag
```

`predict.py --field all` tests only available classifier files. It does not silently
substitute zero-shot predictions. Context-dependent fields can use category/item
heads, or explicit `--category`/`--item` context. Missing required context yields
null with `context_unavailable`. `--models` selects another model directory.

The API loads heads from `training-app/models` (override `FASHION_CLASSIFIERS_DIR`). Existing
`/photos`, `/photos/import`, `/photos/<filename>`, and `/tag` routes are retained.
Tag responses keep the six flat fields and `scores`, adding `predictions` entries
with `value`, `score`, `source`, plus category/item `context`. Each missing head
falls back to FashionCLIP zero-shot scoring. Sources distinguish `classifier`,
`zero_shot`, and unavailable results. Scores are model scores,
not measured accuracy; constrained predictions retain their original probability,
not a fabricated confidence. Unavailable results have null scores.

My Closet exposes a category-specific Item selector alongside the editable name.
New records store the canonical item label separately from the name.

Category is resolved first, item candidates are restricted to that category, and
fit is constrained using that context. A head without any compatible
trained label falls back to zero-shot in the API, or reports unavailable in the
classifier-only CLI. Length and Rise are not loaded, predicted, displayed or added to new clothing records.

Legacy CSV evaluation accepts omitted new columns and now reports all six fields
when labeled. Its accuracy and confusion reporting are retained. Synthetic unit
tests generate models only in temporary directories; they do not produce deployed
clothing classifiers or establish real-world accuracy.

All default data/model paths are anchored to the script location, so parent service
commands work from any working directory. Explicit CLI paths remain relative to
the current working directory. The original parent `labels.jsonl` is retained;
use `--labels` to select it explicitly. Existing training-app bundles without an
`embedding_model` key use the original FashionCLIP identity. No model is retrained
or rewritten merely by loading it.

Saved classifiers must use a compatible scikit-learn runtime. The moved item
classifier was saved with 1.9.1; this checkout’s Python 3.9 environment has 1.6.1.
The service skips an incompatible head and keeps zero-shot fallback available;
the classifier-only CLI reports the incompatibility. Use the original compatible
environment or retrain explicitly with the chosen runtime. Moving files does not
resolve that version mismatch. Existing annotations are not rewritten to resolve
item/category validation conflicts.

The nested trainer accepts only item, category, color, design, material and fit:

```sh
cd training-app
python train_classifier.py --help
python train_classifier.py --field fit
python predict.py photos/t-shirt.jpg --field item
```

Nested prediction preserves `--classifier` for explicit files but rejects retired
attribute bundles. Its default remains the item classifier. The parent predictor
supports `--field all` for all available supported heads. Existing Length/Rise
model files, if any, remain on disk but are not loaded by the service. My Closet
retains opaque legacy saved properties while removing their controls, filters and
AI ingestion. Photos and annotation records are not deleted or relabeled.
