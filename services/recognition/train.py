"""Train independent attribute classifiers from explicitly labeled JSONL."""
import argparse
import json
import math
from collections import Counter
from pathlib import Path
from PIL import Image
from attribute_data import read_labels
from fashion_labels import FIELDS
from project_paths import LABELS_FILE, MODELS_DIR


def split_rows(rows, field, holdout=0.2, seed=42):
    from sklearn.model_selection import train_test_split
    labeled = [row for row in rows if field in row['labels']]
    counts = Counter(row['labels'][field] for row in labeled)
    if len(counts) < 2 or min(counts.values()) < 2:
        raise ValueError(f'{field}: needs at least two labels and two distinct images per label for holdout evaluation')
    test_count = max(len(counts), math.ceil(len(labeled) * holdout))
    if len(labeled) - test_count < len(counts):
        raise ValueError(f'{field}: not enough images for a stratified holdout')
    return train_test_split(labeled, test_size=test_count, random_state=seed,
                            stratify=[row['labels'][field] for row in labeled])


def train_field(rows, field, output, holdout=0.2, seed=42, embed=None, model_name=None):
    import joblib
    import numpy as np
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, classification_report
    from classifiers import image_embedding
    import os
    embedding_model = os.environ.get("FASHIONCLIP_MODEL_PATH", "patrickjohncyh/fashion-clip")
    training, testing = split_rows(rows, field, holdout, seed)
    embed = embed or image_embedding
    def features(records):
        values = []
        for row in records:
            with Image.open(row['path']) as image:
                values.append(embed(image))
        return np.asarray(values)
    classifier = LogisticRegression(max_iter=2000, random_state=seed)
    classifier.fit(features(training), [row['labels'][field] for row in training])
    expected = [row['labels'][field] for row in testing]
    predicted = classifier.predict(features(testing))
    report = {'field': field, 'accuracy': float(accuracy_score(expected, predicted)),
              'classification_report': classification_report(expected, predicted, output_dict=True, zero_division=0),
              'train_count': len(training), 'holdout_count': len(testing),
              'skipped_blank': len(rows) - len(training) - len(testing), 'seed': seed,
              'training_images': [str(row['path']) for row in training],
              'holdout_images': [str(row['path']) for row in testing]}
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    path = output / f'{field}_classifier.joblib'
    # Exclusive output protects existing trained classifiers.
    with path.open('xb') as destination:
        joblib.dump({'field': field, 'embedding_model': model_name or embedding_model, 'classifier': classifier}, destination)
    (output / f'{field}_report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'{field}: holdout accuracy {report["accuracy"]:.4f}')
    print(classification_report(expected, predicted, zero_division=0))
    print(f'Saved {path}')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--labels', type=Path, default=LABELS_FILE)
    parser.add_argument('--field', choices=(*FIELDS, 'all'), default='all')
    parser.add_argument('--output', type=Path, default=MODELS_DIR)
    parser.add_argument('--holdout', type=float, default=0.2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--check-data', action='store_true')
    args = parser.parse_args()
    try:
        if not 0 < args.holdout < 1:
            raise ValueError('--holdout must be between 0 and 1')
        rows = read_labels(args.labels)
        fields = FIELDS if args.field == 'all' else [args.field]
        failures = []
        for field in fields:
            try:
                split_rows(rows, field, args.holdout, args.seed)
                if args.check_data:
                    print(f'{field}: {sum(field in row["labels"] for row in rows)} labeled images; holdout possible')
                else:
                    path = args.output / f'{field}_classifier.joblib'
                    if path.exists():
                        raise ValueError(f'{path} already exists; choose a new --output directory')
                    train_field(rows, field, args.output, args.holdout, args.seed)
            except ValueError as error:
                print(f'Skipped: {error}')
                failures.append(field)
        if failures:
            parser.exit(1, f'Not trained/validated: {", ".join(failures)}\n')
    except (OSError, ValueError, ImportError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
