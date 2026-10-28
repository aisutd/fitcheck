# Fine-tune categories

`train_categories.py` updates FashionCLIP's image encoder and visual projection weights. Text encoder weights stay fixed. It compares images against the same category labels used by the app and minimizes classification cross-entropy. This is real weight training, not memorized per-photo corrections.

This first script trains **category**, not material. It will not specifically teach the model that Teeshift is cotton. Category tuning may also change color/design/material predictions because the image encoder is shared; evaluate those fields before deploying a checkpoint.

## Prepare separate data

Create `training/train.csv` and `training/validation.csv`, each with:

```csv
image,category
images/hoodie-01.jpg,Outerwear
images/sweater-01.jpg,Tops
```

Paths are relative to each CSV. Use different photos in each split. Move all photos of the same garment/product into one split, including alternate views and crops. Keep a third test set (such as `evaluation/labels.csv`) separate from both. The script rejects identical decoded images across training/validation but cannot automatically identify different views of the same product.

Use exact category names from `fashion_labels.py`. Blank categories are skipped; material-only rows do not train categories. Collect many varied, verified examples per category; two photos only suffice to test that the code runs, not to improve a model reliably. Your current answer sheet does not yet have category labels.

## Check and train

Run from `FitCheck_Web/photo-service` using the Python environment with `requirements.txt` installed:

```sh
python3 train_categories.py --train training/train.csv --validation training/validation.csv --check-data
python3 train_categories.py --train training/train.csv --validation training/validation.csv --output models/category-finetuned
```

Default: 3 epochs, batch size 4, learning rate 0.000001, seed 42. Device automatically selects CUDA, Apple MPS, or CPU. Use `--device cpu` if needed; CPU training may be slow. The base model may need downloading on first use. Hardware/library differences can affect reproducibility despite a fixed seed.

The output contains a standard Transformers model, processor, and `training_report.json`. The checkpoint with lowest validation loss wins; the baseline is retained if no epoch improves it. Existing nonempty checkpoint folders are never overwritten. Training runs only when you explicitly invoke the training command.

## Evaluate and use

Compare a baseline report with the checkpoint on the same held-out test images:

```sh
python3 evaluate_tagger.py --output evaluation/baseline.json
FASHIONCLIP_MODEL_PATH="$PWD/models/category-finetuned" python3 evaluate_tagger.py --output evaluation/finetuned.json
```

If the results justify using it, stop your existing photo service and start it with:

```sh
FASHIONCLIP_MODEL_PATH="$PWD/models/category-finetuned" python3 server.py
```

Starting without that environment variable restores the original pretrained model. Training does not automatically change the running service.

References: [Transformers CLIP](https://huggingface.co/docs/transformers/model_doc/clip), [PyTorch cross-entropy](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html).

For independent classifiers for all six attributes, see [CLASSIFIERS.md](CLASSIFIERS.md).
