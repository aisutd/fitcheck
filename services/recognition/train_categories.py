"""Fine-tune FashionCLIP's image encoder using separate category-labeled CSVs."""
import argparse
import csv
import hashlib
import json
import random
from collections import Counter
from pathlib import Path
from PIL import Image, ImageOps
from fashion_labels import CATEGORY_LABELS

BASE_MODEL = 'patrickjohncyh/fashion-clip'


def read_examples(csv_path):
    examples = []
    hashes = set()
    with csv_path.open(newline='', encoding='utf-8-sig') as source:
        reader = csv.DictReader(source)
        if not {'image', 'category'}.issubset(reader.fieldnames or []):
            raise ValueError(f'{csv_path}: requires image and category columns')
        for number, row in enumerate(reader, 2):
            category = (row.get('category') or '').strip()
            if not category:
                continue
            if category not in CATEGORY_LABELS:
                raise ValueError(f'{csv_path}:{number}: unsupported category {category!r}')
            if not (row.get('image') or '').strip():
                raise ValueError(f'{csv_path}:{number}: missing image path')
            path = (csv_path.parent / row['image'].strip()).resolve()
            with Image.open(path) as image:
                # Detect identical decoded images even if re-encoded/renamed.
                pixels = ImageOps.exif_transpose(image).convert('RGB')
                digest = hashlib.sha256(str(pixels.size).encode() + pixels.tobytes()).hexdigest()
            if digest in hashes:
                raise ValueError(f'{csv_path}:{number}: duplicate image: {path.name}')
            hashes.add(digest)
            examples.append({'path': path, 'category': category, 'hash': digest})
    if not examples:
        raise ValueError(f'{csv_path}: no labeled categories; fill in the category column first')
    return examples


def validate_splits(train, validation):
    if {row['hash'] for row in train} & {row['hash'] for row in validation}:
        raise ValueError('Training and validation contain the same image. Use separate photos.')
    train_labels = {row['category'] for row in train}
    if len(train_labels) < 2:
        raise ValueError('Training requires at least two categories.')
    if {row['category'] for row in validation} - train_labels:
        raise ValueError('Every validation category must also have training examples.')


def train_model(args, training, validation):
    import torch
    from transformers import CLIPModel, CLIPProcessor
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = args.device
    if device == 'auto':
        device = 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')
    model = CLIPModel.from_pretrained(args.model).to(device)
    processor = CLIPProcessor.from_pretrained(args.model)
    # Keep text representations fixed; update actual vision encoder weights.
    for name, parameter in model.named_parameters():
        parameter.requires_grad_(name.startswith(('vision_model.', 'visual_projection.')))
    parameters = [parameter for parameter in model.parameters() if parameter.requires_grad]
    optimizer = torch.optim.AdamW(parameters, lr=args.learning_rate, weight_decay=0.01)
    text = processor(text=CATEGORY_LABELS, return_tensors='pt', padding=True)
    text = {key: value.to(device) for key, value in text.items()}
    label_ids = {label: index for index, label in enumerate(CATEGORY_LABELS)}

    def run_epoch(rows, training_mode):
        model.train(training_mode)
        model.text_model.eval()
        ordered = list(rows)
        if training_mode:
            random.shuffle(ordered)
        total_loss = 0.0
        correct = 0
        for start in range(0, len(ordered), args.batch_size):
            batch = ordered[start:start + args.batch_size]
            images = []
            for row in batch:
                with Image.open(row['path']) as image:
                    images.append(ImageOps.exif_transpose(image).convert('RGB'))
            pixels = processor(images=images, return_tensors='pt')['pixel_values'].to(device)
            targets = torch.tensor([label_ids[row['category']] for row in batch], device=device)
            with torch.set_grad_enabled(training_mode):
                logits = model(pixel_values=pixels, **text).logits_per_image
                loss = torch.nn.functional.cross_entropy(logits, targets)
                if training_mode:
                    optimizer.zero_grad(set_to_none=True)
                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(parameters, 1.0)
                    optimizer.step()
            total_loss += loss.item() * len(batch)
            correct += (logits.argmax(dim=1) == targets).sum().item()
        return {'loss': total_loss / len(rows), 'accuracy': correct / len(rows)}

    # Save baseline first; a worse epoch must not replace it.
    baseline = run_epoch(validation, False)
    model.save_pretrained(args.output)
    processor.save_pretrained(args.output)
    best_loss = baseline['loss']
    best_epoch = 0
    history = []
    print(f'Device: {device}; baseline validation: {baseline}', flush=True)
    for epoch in range(1, args.epochs + 1):
        trained = run_epoch(training, True)
        validated = run_epoch(validation, False)
        history.append({'epoch': epoch, 'train': trained, 'validation': validated})
        print(f'Epoch {epoch}: train={trained}; validation={validated}', flush=True)
        if validated['loss'] < best_loss:
            best_loss = validated['loss']
            best_epoch = epoch
            model.save_pretrained(args.output)
    report = {
        'base_model': args.model, 'field': 'category', 'labels': CATEGORY_LABELS,
        'seed': args.seed, 'learning_rate': args.learning_rate, 'batch_size': args.batch_size,
        'best_epoch': best_epoch, 'baseline': baseline, 'epochs': history,
        'train_csv': str(args.train.resolve()), 'validation_csv': str(args.validation.resolve()),
        'train_images': [{**row, 'path': str(row['path'])} for row in training],
        'validation_images': [{**row, 'path': str(row['path'])} for row in validation],
    }
    (args.output / 'training_report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Saved best checkpoint (epoch {best_epoch}) to {args.output}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--train', required=True, type=Path)
    parser.add_argument('--validation', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=Path('models/category-finetuned'))
    parser.add_argument('--model', default=BASE_MODEL)
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch-size', type=int, default=4)
    parser.add_argument('--learning-rate', type=float, default=1e-6)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--device', choices=['auto', 'cpu', 'mps', 'cuda'], default='auto')
    parser.add_argument('--check-data', action='store_true', help='Validate CSVs without loading or training a model')
    args = parser.parse_args()
    try:
        if args.epochs < 1 or args.batch_size < 1 or not 0 < args.learning_rate < 1:
            raise ValueError('Epochs/batch size must be positive and learning rate between 0 and 1.')
        training = read_examples(args.train)
        validation = read_examples(args.validation)
        validate_splits(training, validation)
        for name, rows in [('Training', training), ('Validation', validation)]:
            print(f'{name}: {len(rows)} images; {dict(Counter(row["category"] for row in rows))}')
        missing = set(CATEGORY_LABELS) - {row['category'] for row in training}
        if missing:
            print(f'No training examples for: {", ".join(sorted(missing))}. Check for regressions on these categories.')
        if args.check_data:
            return
        if args.output.exists() and any(args.output.iterdir()):
            raise ValueError('Output directory is not empty. Choose a new directory to preserve existing checkpoints.')
        args.output.mkdir(parents=True, exist_ok=True)
        train_model(args, training, validation)
    except (OSError, ValueError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
