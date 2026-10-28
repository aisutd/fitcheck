> Active classification fields: **Item, Category, Color, Design, Material, Fit**.
> Length and Rise are retired. Existing annotation records and saved model files
> are retained; retired fields are ignored by the service. No labels are invented.

# Fashion model training starter

This is a small, separate workspace for labeling photos and training a first
classifier on top of FashionCLIP. The original images are copied into `photos/`.
The copied set is only a starter set; it is far too small to make a useful
classifier by itself. Add more varied photos and correct labels before relying
on its results.

For the full workflow, evaluation advice, and future `photo-service`
integration notes, see [TRAINING_GUIDE.md](TRAINING_GUIDE.md).

## 1. Label the photos

Edit `labels.jsonl`. Each line is one JSON object; its `filename` must match a
file in `photos/`. Fill in labels yourself rather than trusting filenames. For
example:

```json
{"filename":"t-shirt.jpg","item":"t-shirt","category":"Tops","color":"Blue"}
{"filename":"boots.jpg","item":"boots","category":"Shoes","color":"Black"}
```

The example file lists every copied image with blank labels. Replace the blank
values with labels you have checked. Keep the category spelling consistent
(such as `Tops`, `Bottoms`, `Shoes`, `Suits`, `Dresses`, `Socks`).

## 2. Install dependencies

From this directory, create and activate a Python virtual environment, then run:

```powershell
python -m pip install -r requirements.txt
```

The first training run downloads FashionCLIP weights from Hugging Face, so it
needs access to the model files. A GPU helps, but this small embedding workflow
can run on CPU too (more slowly).

## 3. Train and evaluate an item classifier

```powershell
python train_classifier.py --field item
```

The script reads the labeled rows, turns each image into a FashionCLIP image
embedding, trains a logistic-regression classifier, reports accuracy on a
stratified holdout, then saves a final classifier trained on all labeled rows
to `models/item_classifier.joblib`. The holdout score is only meaningful when
you have enough varied examples per label. Aim for dozens or hundreds per item
type; two examples per label only satisfy the script's minimum check.

Other fields can be trained separately after you fill them in:

```powershell
python train_classifier.py --field category
python train_classifier.py --field color
```

Each saved classifier learns only the selected field. The category value can
come from your app's category taxonomy; it does not automatically learn a
specific item-to-category mapping.

## 4. Try the saved item classifier

```powershell
python predict.py photos/t-shirt.jpg
```

This produces an item prediction from the saved classifier. To use it in
`photo-service`, copy or configure the saved model path and call the same
embedding/classifier steps in the `/tag` flow. Retrain after adding corrected
examples; simply saving labels does not update the classifier.

## Label data format

`labels.jsonl` is a JSON Lines file: one JSON object per line, with any number
of filenames. The photo name is just a lookup key; labels are the supervision
used to train the classifier. Do not rename images to encode their labels.

## Location inside photo-service

This folder now lives at `photo-service/training-app/`. Its existing scripts still
resolve photos, labels and models relative to this folder. From `photo-service/`,
the shared six-attribute commands use these same data/model directories:

```sh
python train.py --field all --check-data
python predict.py training-app/photos/t-shirt.jpg --field item
python server.py
```

`../fashion_labels.py` remains the shared service label mapping. The service now
loads classifier files directly from this folder’s `models/`; no copying is needed.
`FASHION_CLASSIFIERS_DIR` or `predict.py --models` can select another directory.
Annotations are validated without changing the labels you entered.
