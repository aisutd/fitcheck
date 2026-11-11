> Active classification fields: **Item, Category, Color, Design, Material, Fit**.
> Length and Rise are retired. Existing annotation records and saved model files
> are retained; retired fields are ignored by the service. No labels are invented.

> Location update: this folder now lives inside `photo-service/training-app/`.
> The service reads its `models/` directly; copying models to a sibling directory
> is no longer needed. Use the parent [CLASSIFIERS.md](../CLASSIFIERS.md) for the
> current shared trainer, predictor and API integration. Historical integration
> snippets below describe the previous layout and are not setup steps to apply.

# Training a Fashion Classifier

This guide explains how to improve the app's clothing predictions with labeled
photos. The starter project trains a small classifier on image features from
FashionCLIP. It does **not** fine-tune or replace FashionCLIP.

For the short setup and command reference, see [README.md](README.md).

## What the training workflow does

An **image embedding** is a list of numbers FashionCLIP's pretrained image
encoder produces to represent visual features in a photo. It is not a search
for a matching photo in FashionCLIP's training data or in your `photos/`
folder.

There are two different ways to turn that image into a label:

- **Zero-shot FashionCLIP:** it compares the input photo with text descriptions
  made from candidate labels, such as `"a photo of a shirt"` or
  `"a photo of a jacket"`. The candidate list limits which labels it can
  return. You can change the list or prompts without training a classifier.
- **Trained classifier:** the training script runs your labeled photos through
  FashionCLIP, then teaches a logistic-regression classifier to associate each
  resulting embedding with the corresponding value in `labels.jsonl`. At
  prediction time, the classifier uses the new photo's embedding to choose
  among the labels it learned. It does not look up or compare the new photo
  against the original training photos. Adding a new classifier label requires
  labeled examples and retraining.

Both methods have a limited set of possible output labels, but the source of
the decision differs: zero-shot uses the label text, while the trained
classifier uses patterns learned from your labeled photo embeddings. The
training workflow lets you experiment with your examples without training a
large vision model from scratch.

The workflow currently runs as a separate tool in `training-app/`. Training a
classifier does not automatically change predictions returned by
`photo-service`.

## End-to-end workflow at a glance

The work moves through three parts of the project:

```mermaid
flowchart LR
    A[Photos and labels.jsonl] --> B[training-app: train and evaluate]
    B --> C[.joblib classifier files]
    C --> D[photo-service: load model and predict]
    E[New photo] --> D
    D --> F[/tag JSON response]
    F --> G[Fitcheck fills the add form]
```

1. **Confirm the labels and category mapping.** Make sure specific item names
   such as `t-shirt` map to Fitcheck's broad categories in
   `photo-service/fashion_labels.py`. Fitcheck must allow each broad category.
2. **Collect and label photos.** Put the images in `training-app/photos/` and
   fill their item, category, and color values in `training-app/labels.jsonl`.
3. **Train the fields you need.** Run `train_classifier.py` separately for
   `item`, `category`, or `color`. Each run saves its own `.joblib` file in
   `training-app/models/`.
4. **Evaluate before choosing a model.** The training command reports the
   trained classifier's holdout results. To compare it fairly with FashionCLIP
   zero-shot, evaluate both on the same held-out photos. The comparison code
   later in this guide is an example that still needs to be added to
   `train_classifier.py`; the current script does not print that baseline.
5. **Connect selected model files to the service.** Copy each chosen `.joblib`
   file to `photo-service/models/`, install `scikit-learn` and `joblib` in the
   service environment, then add the loader and inference code to
   `photo-service/fashion_tagger.py`.
6. **Compare live predictions, then select fields.** While checking the
   integration, return zero-shot and trained predictions separately. After
   evaluation, configure each field to use the method that performed better.
   When using a trained item prediction, map it to the broad category with
   `ITEM_TO_CATEGORY`.
7. **Check the app flow.** `photo-service/server.py` already sends the result
   of `tag_image()` through `/tag`. Fitcheck reads the returned item, category,
   and other fields to fill its add form.

Until steps 4–6 are implemented and checked, the existing app continues to use
its FashionCLIP zero-shot predictions; training a classifier alone does not
switch the app over.

## 1. Prepare the app to use specific item names

Before collecting training labels, decide how a specific item name should fit
into Fitcheck's broader category system. For example, the model should be able
to identify `t-shirt`, while the closet still stores it under `Tops`. This
keeps the detailed prediction useful to the person adding an item and keeps
the existing category tabs working.

The photo service needs to identify the specific item and return both values:

```python
item = "t-shirt"
category = ITEM_TO_CATEGORY[item]
# Return both, for example: {"item": "t-shirt", "category": "Tops"}
```

The mapping belongs in `photo-service/fashion_labels.py`, alongside the
candidate item labels. Keep every item label used by the tagger in the mapping:

```python
ITEM_TO_CATEGORY = {
    "t-shirt": "Tops",
    "shirt": "Tops",
    "blouse": "Tops",
    "coat": "Tops",
    "jacket": "Tops",
    "sweater": "Tops",
    "jeans": "Bottoms",
    "pants": "Bottoms",
    "shorts": "Bottoms",
    "skirt": "Bottoms",
    "dress": "Dresses",
    "boots": "Shoes",
    "sneakers": "Shoes",
}
```

Then `photo-service/fashion_tagger.py` should predict the specific item first,
look up its broad category, and return both fields. Fitcheck's add form should
put the item name in its name field and the mapped value in its category
field. The mapping itself belongs in the photo service; Fitcheck does not need
a duplicate mapping because it receives both values in the tag response.

In this project, that flow is already implemented: `fashion_labels.py` defines
`ITEM_TO_CATEGORY`, `fashion_tagger.py` returns both `item` and `category`,
and Fitcheck reads `tags.item` and `tags.category` in `fitcheck/TabScreen.js`.
So you do not need to add this mapping again before using the current app. If
you add item types or broad categories, update the photo service's item labels
and mapping together, and make sure any new broad category is also an allowed
option in Fitcheck. Then check that a tag response contains the expected pair,
for example `{"item":"t-shirt","category":"Tops"}`.

### Verify the mapping and the live tag endpoint

These steps use PowerShell on Windows and the sample `t-shirt.jpg` image
already in `training-app/photos/`. The live tag endpoint loads FashionCLIP, so
the first request can take a while while the model downloads or initializes.

1. Open PowerShell and start the photo service. Leave this window open:

   ```powershell
   cd C:\utd\photo-service
   py -m venv .venv
   Test-Path .\.venv\Scripts\python.exe
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe server.py
   ```

   `Test-Path` should print `True`. If it prints `False`, the virtual
   environment was not created; run `py -m venv .venv` again and check for an
   error before continuing. If `py` is not recognized, try
   `python -m venv .venv`. If the virtual environment already exists, you can
   skip its creation command. After the dependencies finish installing, start
   the service. A successful startup looks similar to this:

   ```text
   * Serving Flask app 'server'
   * Debug mode: off
   WARNING: This is a development server. Do not use it in a production deployment.
   * Running on all addresses (0.0.0.0)
   * Running on http://127.0.0.1:5050
   * Running on http://192.168.1.138:5050
   Press CTRL+C to quit
   ```

   The exact network address may differ. The development-server warning is
   expected for this local check. Leave this PowerShell window open while you
   run the verification commands or use Fitcheck; press `Ctrl+C` when you are
   finished to stop the service.

2. Open a second PowerShell window and verify the mapping directly. This
   checks the lookup without asking the image model to make a prediction:

   ```powershell
   cd C:\utd\photo-service
   .\.venv\Scripts\python.exe -c "from fashion_labels import ITEM_TO_CATEGORY; assert ITEM_TO_CATEGORY['t-shirt'] == 'Tops' and ITEM_TO_CATEGORY['tee'] == 'Tops'; print('PASS: t-shirt and tee map to Tops')"
   ```

   You should see `PASS: t-shirt and tee map to Tops`.

   If you only want to check the mapping and have not created the virtual
   environment, use the regular Python installation instead:

   ```powershell
   cd C:\utd\photo-service
   python -c "from fashion_labels import ITEM_TO_CATEGORY; assert ITEM_TO_CATEGORY['t-shirt'] == 'Tops' and ITEM_TO_CATEGORY['tee'] == 'Tops'; print('PASS: t-shirt and tee map to Tops')"
   ```

3. Send the sample image to the running `/tag` endpoint and check its response:

   ```powershell
   $tag = curl.exe --silent --show-error --fail-with-body `
     -F "photo=@C:\utd\training-app\photos\t-shirt.jpg" `
     http://127.0.0.1:5050/tag | ConvertFrom-Json

   $tag | Select-Object item, category, color, design, material

   $mappedCategory = .\.venv\Scripts\python.exe -c "import sys; from fashion_labels import ITEM_TO_CATEGORY; print(ITEM_TO_CATEGORY.get(sys.argv[1].strip().lower(), ''))" $tag.item
   if ($mappedCategory -and $tag.category -eq $mappedCategory) {
       "PASS: '$($tag.item)' maps to '$mappedCategory' and matches the API category"
   } else {
       "CHECK: item='$($tag.item)', mapping='$mappedCategory', API category='$($tag.category)'"
   }
   ```

   The API returns additional fields too, so the full JSON will contain more
   than just `item` and `category`. For example, `{"item":"tee","category":"Tops"}`
   is a valid mapped result because `tee` is an alias for `Tops` in
   `ITEM_TO_CATEGORY`. The command checks that the category returned by the API
   matches the map for the item the model actually predicted. It does not
   prove that the model chose the best item label for the photo; assess that
   separately by looking at the image and prediction. If the command reports
   an HTTP or connection error, check that the service is still running and
   that the uploaded file path exists.

### Verify that Fitcheck receives the tags

For the simplest local check, run Fitcheck in a web browser on the same
computer as the photo service. The configured service address is
`http://localhost:5050`, so a phone or emulator may need a different host
address.

1. In a third PowerShell window, start Fitcheck for web:

   ```powershell
   cd C:\utd\fitcheck
   npm run web
   ```

2. Open the local address printed by Expo in your browser, go to **Add Item**,
   and choose `C:\utd\training-app\photos\t-shirt.jpg` as the photo.
3. Wait for tagging to finish. The form should fill the item name from
   `tags.item` (displayed as `T-Shirt`) and the category from `tags.category`
   (`Tops`). Confirm the category selector shows **Tops**. You can close the
   form without saving if you are only checking the integration.

If the direct `/tag` request returns the expected pair but Fitcheck does not
fill these fields, check the browser developer console for a request to
`http://localhost:5050/tag` and any CORS or network error. The direct request
checks photo-service and the mapping; the browser check confirms Fitcheck also
receives and applies the response.

This is the app's zero-shot prediction flow. The classifier trained in this
guide is a later experiment; it is not currently connected to the photo
service. First make sure the existing item-to-category flow returns the
specific item and correct broad category. Then training examples can use the
same item names and categories.

## 2. Choose a field and labels

Start with one field, preferably `item`, and a manageable set of visually
distinct item labels. Use the same spelling and capitalization for the same
label throughout the dataset. For example:

| Specific item label                                       | Fitcheck category |
| --------------------------------------------------------- | ----------------- |
| `t-shirt`, `shirt`, `blouse`, `coat`, `jacket`, `sweater` | `Tops`            |
| `jeans`, `pants`, `shorts`, `skirt`                       | `Bottoms`         |
| `dress`, `jumpsuit`                                       | `Dresses`         |
| `boots`, `sneakers`, `sandals`                            | `Shoes`           |

The mapping is for the app's broader category. Training an `item` classifier
teaches specific item names; it does not automatically apply this mapping.

## 3. Label the photos

Put image files in `training-app/photos/` and edit `labels.jsonl`. Each line
must be one JSON object, and `filename` must exactly match a photo in that
folder. Fill in labels after checking the image; filenames are not training
labels.

```json
{"filename":"t-shirt.jpg","item":"t-shirt","category":"Tops","color":"Blue"}
{"filename":"boots.jpg","item":"boots","category":"Shoes","color":"Black"}
```

Blank fields are ignored when training that field. Keep the category values
consistent with the app, for example `Tops`, `Bottoms`, `Shoes`, `Suits`,
`Dresses`, or `Socks`.

Use varied photos for each label: different people, poses, backgrounds,
lighting, colors, and garment styles. Avoid letting near-duplicate images
appear in both training and evaluation data. A few examples can get the script
running, but do not establish that the classifier will work reliably. Aim for
dozens or hundreds of representative, correctly labeled images per class as
the dataset grows.

## 4. Install and train

From this folder, install the dependencies:

```powershell
cd c:\utd\training-app
python -m pip install -r requirements.txt
```

Then train the item classifier:

```powershell
python train_classifier.py --field item
```

### Understanding the evaluation report

After the command finishes evaluating, you will see a report like this:

| Item       | Precision | Recall | F1 score | Support |
| ---------- | --------: | -----: | -------: | ------: |
| boots      |      1.00 |   1.00 |     1.00 |       1 |
| dress      |      0.00 |   0.00 |     0.00 |       1 |
| dress shoe |      1.00 |   1.00 |     1.00 |       2 |
| jacket     |      1.00 |   1.00 |     1.00 |       1 |
| jeans      |      1.00 |   1.00 |     1.00 |       1 |
| pants      |      1.00 |   1.00 |     1.00 |       1 |
| shirt      |      0.00 |   0.00 |     0.00 |       1 |
| shorts     |      1.00 |   1.00 |     1.00 |       1 |
| sneakers   |      1.00 |   1.00 |     1.00 |       2 |
| sweater    |      0.00 |   0.00 |     0.00 |       0 |

In this example, the overall accuracy is **81.8%**: 9 of the 11 held-out
photos were classified correctly. **Support** is the number of actual photos
of that item in the holdout. **Precision** tells you how often predictions of
that item were right; **recall** tells you how many of its actual holdout
photos the classifier found; **F1 score** combines precision and recall.

The holdout is the 25% of labeled photos set aside from fitting the temporary
evaluation classifier. The classifier is fitted on the remaining 75%, then
tested against labels for the held-out photos it did not train on. In this
example, most item types have only one test photo, so one mistake can change a
per-item score sharply. A support of `0` means there was no actual holdout
photo for that item, so the report cannot measure its performance on that
item. After this evaluation, the script fits a separate final classifier on
all labeled photos and saves it.

The first run downloads FashionCLIP from Hugging Face, so the machine needs
access to those model files. The script uses a GPU when available and otherwise
runs on CPU, which may take longer.

The script requires at least two labels and at least two photos for every
label. It creates a stratified holdout, reports its accuracy and per-label
metrics, then fits the saved classifier using all labeled examples. The
default output is `models/item_classifier.joblib`.

You can train the other supported fields separately after labeling enough
examples for them:

```powershell
python train_classifier.py --field category
python train_classifier.py --field color
```

Each command starts a separate training run and uses only the selected field
from `labels.jsonl`. Before running it, make sure that field has labels for
several photos, with at least two photos for each distinct value and enough
photos overall for the holdout split. Blank values are skipped. For example,
the category run ignores rows whose `category` is blank.

You should see FashionCLIP load, an embedding progress message for each labeled
photo, a holdout accuracy and per-label report, and then a `Saved classifier`
message. The default output files are:

- `--field category` saves `models/category_classifier.joblib`.
- `--field color` saves `models/color_classifier.joblib`.

These are separate from `models/item_classifier.joblib`, so category and color
runs do not change the item classifier. Running the same field again saves to
the same filename and replaces that field's previous classifier. The script
creates `models/` if it does not exist. If there are not enough labeled
examples, it stops with an error explaining what is missing and does not save
a new classifier.

Each model learns only its selected field. For example, the `category` model
does not learn the `item` field or the item-to-category mapping.

## 5. Try a saved classifier

After training, run a prediction on a photo:

```powershell
python predict.py photos/t-shirt.jpg
```

To load a classifier from a different path, pass `--classifier`:

```powershell
python predict.py photos/t-shirt.jpg --classifier models/item_classifier.joblib
```

If you have trained multiple fields, this PowerShell loop runs every saved
classifier on the same photo. Run it from `training-app/`; missing model files
are skipped, so you only need to train the classifiers you want to use:

```powershell
$models = @(
    'item_classifier.joblib',
    'category_classifier.joblib',
    'color_classifier.joblib'
)

foreach ($model in $models) {
    $classifierPath = Join-Path 'models' $model
    if (Test-Path $classifierPath) {
        python predict.py photos/t-shirt.jpg --classifier $classifierPath
    } else {
        Write-Host "Skipping $classifierPath (not found; train this field first)."
    }
}
```

The loop runs a separate prediction for each model and prints each field's
result. It does not combine the predictions into one tag, and FashionCLIP is
loaded separately for each run.

The printed classifier score is a model score, not a calibrated probability
that the prediction is correct. Use evaluation on held-out labeled photos to
judge performance; do not compare this number directly with FashionCLIP's
zero-shot softmax scores, which come from a different method.

## 6. Evaluate before relying on it

Use the explanation and sample report above to read the output. Treat scores
from a small holdout cautiously: the reported accuracy can change with a
different split, and a single mistake has a large effect when support is low.
Add more representative labeled photos, inspect mistakes, and repeat the
evaluation. Keep a separate set of photos aside for a final check if you are
making repeated changes based on the holdout results.

A practical improvement loop is:

1. Save examples where the prediction is wrong and record the corrected label.
2. Add those examples, along with varied examples of the same labels, to the
   labeled dataset.
3. Retrain and compare results on examples that were not used to fit the
   classifier.
4. Expand to another field only after the first one has enough useful data.

Changing `labels.jsonl` does not update an existing model; run the training
script again after changing labels.

## Connecting it to `photo-service` later

The classifier is not currently loaded by `photo-service`. Keep the current
FashionCLIP prediction working while you first compare its item guesses with
the trained classifier's guesses. The `/tag` route in
`photo-service/server.py` already calls `fashion_tagger.tag_image()` and
returns its result, so the main inference changes belong in
`photo-service/fashion_tagger.py`.

There are two separate tasks: **measure accuracy offline in
`training-app/train_classifier.py`**, then, if you choose to integrate the
classifier, optionally have `photo-service` return both predictions for
individual photos. The service response does not calculate an accuracy report.

The two models do not combine their scores into one prediction. FashionCLIP
can make its existing zero-shot guess by matching the image against text
labels. The trained classifier uses a FashionCLIP image embedding and applies
its own learned decision to that same image. During comparison, return both
guesses separately. After measuring them against labeled holdout photos, choose
which model supplies each field; keep FashionCLIP for fields where the trained
classifier does not perform better.

### 1. Copy the trained models and install service dependencies

Copy each model you trained from `training-app/models/` to
`photo-service/models/`, keeping its filename:

| Training field | Copy this file to `photo-service/models/` |
| -------------- | ----------------------------------------- |
| `item`         | `item_classifier.joblib`                  |
| `category`     | `category_classifier.joblib`              |
| `color`        | `color_classifier.joblib`                 |

Only copy the files that exist. Create `photo-service/models/` if needed. When
you are ready to connect the classifiers, add these as two separate lines to
`photo-service/requirements.txt`:

```text
scikit-learn
joblib
```

`scikit-learn` provides the classifier code, and `joblib` loads the saved
`.joblib` files. You do not need to add them to `photo-service` while the
trained classifiers are still separate from that service. When integrating,
install the updated requirements in the photo-service virtual environment.
Keep its scikit-learn version compatible with the version used by
`training-app` when the models were saved. Restart the photo service after
copying updated model files.

### 2. Load all available classifiers once

In `photo-service/fashion_tagger.py`, add a cached loader near `_load_model()`.
This example supports the three fields accepted by `train_classifier.py` and
silently skips fields that have not been trained:

```python
from pathlib import Path
import joblib

CLASSIFIER_DIR = Path(__file__).resolve().parent / "models"
CLASSIFIER_FIELDS = ("item", "category", "color")
_classifiers = None

def _load_classifiers():
    global _classifiers
    if _classifiers is None:
        _classifiers = {}
        for field in CLASSIFIER_FIELDS:
            path = CLASSIFIER_DIR / f"{field}_classifier.joblib"
            if not path.is_file():
                continue
            bundle = joblib.load(path)
            if bundle.get("field") != field:
                raise ValueError(f"Expected a {field} classifier in {path}")
            _classifiers[field] = bundle["classifier"]
    return _classifiers
```

The loader reads each available file once. After retraining, copy the updated
file and restart `photo-service` so the cache loads the new version.

### 3. Run every available classifier on one image embedding

**This is a suggested future change; the code is not in the current
`photo-service` yet.** In the current `fashion_tagger.py`, FashionCLIP makes
the zero-shot predictions around lines 172–179, then returns them beginning
around line 181. To compare models, add the embedding and classifier code below
after the existing predictions and before the `return` statement. Then add the
`classifier_predictions` field shown below to the returned dictionary.

Keep the existing FashionCLIP zero-shot predictions. Create one image
embedding using the same preprocessing and
normalization as training, then pass that embedding to each available
classifier. The current Transformers API may return an object with
`pooler_output`; older versions may return a tensor, so handle both:

The following codes added inside the tag_image() in photo-service/fashion_tagger.py

```python
image_inputs = processor(images=image, return_tensors="pt")
with torch.no_grad():
    features = model.get_image_features(**image_inputs)
    if hasattr(features, "pooler_output"):
        features = features.pooler_output
    elif isinstance(features, tuple):
        features = features[0]
    features = features / features.norm(dim=-1, keepdim=True).clamp_min(1e-12)

feature_array = features.detach().cpu().numpy()
classifier_predictions = {}
for field, classifier in _load_classifiers().items():
    prediction = classifier.predict(feature_array)[0]
    score = classifier.predict_proba(feature_array)[0].max()
    classifier_predictions[field] = {
        "label": str(prediction),
        "score": float(score),
    }
```

For this side-by-side comparison response, leave the existing top-level `item`,
`category`, and `color` fields unchanged. Add the classifier predictions to the
dictionary returned by `tag_image()`:

```python
"classifier_predictions": classifier_predictions,
```

The response will then include any trained fields, for example:

```json
{
  "item": "tee",
  "category": "Tops",
  "color": "Green",
  "classifier_predictions": {
    "item": { "label": "t-shirt", "score": 0.3 },
    "category": { "label": "Tops", "score": 0.82 },
    "color": { "label": "Blue", "score": 0.47 }
  }
}
```

The exact fields depend on which model files are present. `/tag` already
returns the dictionary from `tag_image()`, so `photo-service/server.py` does
not need a change just to pass through this extra field. **Do not put the code
above after the call in `server.py`.** Put it inside `fashion_tagger.py`'s
`tag_image()` before its `return`. Then `server.py` line 68 calls that function
once, and line 69 returns the complete dictionary as JSON, including both the
existing zero-shot results and `classifier_predictions`.

### Offline evaluation in `training-app`: compare both models on the same holdout photos

The `/tag` response gives you both predictions for one photo; it does not
calculate which model is more accurate or produce an evaluation report. For a
fair accuracy comparison, modify `training-app/train_classifier.py` to run both
approaches on the **same held-out photos** and compare
each prediction with its correct `item` label. In `train_classifier.py`, use
the temporary `evaluation_model`, which is fitted only on `train_idx`; do not
use the final saved classifier for this check, because that model is fitted on
all labeled photos.

The current `image_embeddings()` function loads FashionCLIP internally and
returns only the features. For this comparison, keep references to the same
FashionCLIP model and processor by changing its return and unpacking it in
`main()`:

```python
# At the end of image_embeddings():
return np.asarray(vectors, dtype=np.float32), model, processor

# In main(), in place of `features = image_embeddings(records)`:
features, clip_model, processor = image_embeddings(records)
```

Add a zero-shot item helper that uses the same candidate item names as
`photo-service/fashion_labels.py`:

```python
def predict_zero_shot_item(image_path, model, processor, item_labels):
    image = Image.open(image_path).convert("RGB")
    prompts = [f"a photo of a {label}" for label in item_labels]
    inputs = processor(
        text=prompts, images=image, return_tensors="pt", padding=True
    )
    with torch.no_grad():
        logits = model(**inputs).logits_per_image[0]
    return item_labels[int(logits.argmax())]
```

At the point where `evaluation_model` has been fitted and `test_idx` is
available, compare its predictions and FashionCLIP's predictions on exactly
those test rows:

```python
from sklearn.metrics import accuracy_score, classification_report

actual_items = labels[test_idx]
trained_items = evaluation_model.predict(features[test_idx])
zero_shot_items = [
    predict_zero_shot_item(records[index][0], clip_model, processor, ITEM_LABELS)
    for index in test_idx
]

for name, predictions in (
    ("FashionCLIP zero-shot", zero_shot_items),
    ("Trained classifier", trained_items),
):
    print(f"\n{name} accuracy: {accuracy_score(actual_items, predictions):.1%}")
    print(classification_report(actual_items, predictions, zero_division=0))
```

Import or define `ITEM_LABELS` in the training script using the same candidate
names as the photo service. Repeat the same comparison for category or color
only if those fields have their own trained classifiers and correct labels.
Use the two reports and the individual mistakes to decide; do not compare the
models' score values with each other.

### 4. Choose which prediction supplies each app field

After evaluating the models, choose a source separately for each field. Set
these switches based on the held-out comparison above, not on an individual
photo's score. For example, this uses the trained item and color models, while
keeping FashionCLIP's category prediction:

```python
USE_TRAINED_ITEM = True   # Set True only if held-out evaluation supports it.
USE_TRAINED_CATEGORY = False
USE_TRAINED_COLOR = True  # Set True only if held-out evaluation supports it.

item = zero_shot_item
if USE_TRAINED_ITEM and "item" in classifier_predictions:
    item = classifier_predictions["item"]["label"]

category = zero_shot_category
if USE_TRAINED_CATEGORY and "category" in classifier_predictions:
    category = classifier_predictions["category"]["label"]
elif USE_TRAINED_ITEM and "item" in classifier_predictions:
    # Keep the broad category consistent with the selected specific item.
    category = ITEM_TO_CATEGORY.get(item.strip().lower(), zero_shot_category)

color = zero_shot_color
if USE_TRAINED_COLOR and "color" in classifier_predictions:
    color = classifier_predictions["color"]["label"]
```

If you also trained a category classifier, evaluate it separately before
choosing it as the source for `category`. When using the item-to-category map,
check that every item label has a matching entry in
`photo-service/fashion_labels.py`'s `ITEM_TO_CATEGORY`; otherwise the mapping
will return no category. Fitcheck already reads the top-level `item`,
`category`, and `color` response fields, so it can continue using those fields.
`training-app/` remains responsible for labels and training, while
`photo-service/` loads the saved models and makes predictions.
