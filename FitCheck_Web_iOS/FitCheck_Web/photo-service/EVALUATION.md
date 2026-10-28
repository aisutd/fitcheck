# Evaluate FashionCLIP

This evaluates the current pretrained weights and current `tag_image()` logic. It does not train or modify the model. Use held-out images with labels you checked manually; do not copy the model's predictions into the answer sheet.

1. Open `evaluation/labels.csv`. Each row already points to an image in `fitcheck/public/item-photos`.
2. Fill in known category, color, design, and material values using the exact label names supported in `fashion_tagger.py` (category names come from `fashion_labels.py`). Leave any field blank when you do not know its true value, especially material. A photo alone may not establish fabric composition.
3. From `FitCheck_Web/photo-service`, run:

```sh
python3 evaluate_tagger.py
```

The first prediction may need to download FashionCLIP weights. The command prints per-field accuracy and saves `evaluation/report.json` with every prediction, expected labels, scores, failures, and a category confusion table. Confusion keys are expected categories; nested keys are predicted categories. Scores are relative preferences, not calibrated probabilities.

Unlabeled fields are excluded from accuracy. Completely unlabeled images are skipped. Failed labeled images count as incorrect and the command exits unsuccessfully after writing the report, so failures cannot inflate accuracy. An entirely blank answer sheet produces an explanatory error instead of a score.

To compare model or prompt changes, keep the same held-out answer sheet and save separate reports:

```sh
python3 evaluate_tagger.py --output evaluation/baseline.json
# Change your model or prompts, then evaluate the same images:
python3 evaluate_tagger.py --output evaluation/updated.json
```

Include examples of each category, especially Hoodies and Tops. Small test sets give rough estimates; avoid using held-out evaluation images for fine-tuning. Label each photo's main clothing item consistently.

For another image folder, create a fresh CSV (existing CSVs are never overwritten):

```sh
python3 evaluate_tagger.py --init /path/to/images --labels evaluation/new-labels.csv
python3 evaluate_tagger.py --labels evaluation/new-labels.csv --output evaluation/new-report.json
```

The older `eval_accuracy.py` is an unfinished Kaggle workflow; use `evaluate_tagger.py` for local evaluation.
