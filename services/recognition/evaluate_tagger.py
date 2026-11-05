"""Evaluate the current tagger against a manually labeled CSV; never trains it."""
import argparse
import csv
import json
import os
from collections import Counter
from pathlib import Path
from PIL import Image, ImageOps

from fashion_labels import FIELDS


def create_template(image_dir, csv_path):
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation protects any labels already entered by hand.
    with csv_path.open('x', newline='') as output:
        writer = csv.DictWriter(output, fieldnames=('image',) + FIELDS)
        writer.writeheader()
        for image in sorted(image_dir.iterdir()):
            if image.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp', '.gif'):
                import os
                writer.writerow({'image': Path(os.path.relpath(image.resolve(), csv_path.parent.resolve())).as_posix()})


def evaluate(csv_path, predict):
    with csv_path.open(newline='', encoding='utf-8-sig') as source:
        reader = csv.DictReader(source)
        if not reader.fieldnames or 'image' not in reader.fieldnames:
            raise ValueError('CSV requires an image column; attribute columns may be blank or omitted.')
        rows = list(reader)
    if not rows:
        raise ValueError('CSV has no images to evaluate.')
    metrics = {field: {'correct': 0, 'total': 0} for field in FIELDS}
    confusion = {}
    results = []
    labeled = 0
    for number, row in enumerate(rows, 2):
        expected = {field: (row.get(field) or '').strip() for field in FIELDS}
        if not any(expected.values()):
            results.append({'row': number, 'image': row.get('image'), 'skipped': 'No manual labels'})
            continue
        labeled += 1
        record = {'row': number, 'image': row.get('image'), 'expected': expected}
        try:
            if not (row.get('image') or '').strip():
                raise ValueError('Missing image path')
            image_path = csv_path.parent / row['image'].strip()
            with Image.open(image_path) as image:
                prediction = predict(ImageOps.exif_transpose(image).convert('RGB'))
            record['predicted'] = {field: prediction.get(field) for field in FIELDS}
            record['scores'] = prediction.get('scores', {})
        except Exception as error:
            record['error'] = str(error)
            prediction = {}
        for field in FIELDS:
            if expected[field]:
                metrics[field]['total'] += 1
                metrics[field]['correct'] += int(expected[field].casefold() == str(prediction.get(field, '')).casefold())
        if expected['category']:
            actual = expected['category']
            guessed = prediction.get('category') or '(error)'
            confusion.setdefault(actual, Counter())[guessed] += 1
        results.append(record)
    if not labeled:
        raise ValueError('No manual labels found. Fill in the CSV before evaluating.')
    for counts in metrics.values():
        counts['accuracy'] = counts['correct'] / counts['total'] if counts['total'] else None
    return {
        'model': os.environ.get('FASHIONCLIP_MODEL_PATH', 'patrickjohncyh/fashion-clip'),
        'labeled_images': labeled,
        'failed_images': sum('error' in result for result in results),
        'metrics': metrics,
        'category_confusion': confusion,
        'results': results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--labels', type=Path, default=Path('evaluation/labels.csv'))
    parser.add_argument('--init', type=Path, metavar='IMAGE_DIRECTORY', help='Create a blank label CSV from a folder; does not predict')
    parser.add_argument('--output', type=Path, default=Path('evaluation/report.json'))
    args = parser.parse_args()
    try:
        if args.init:
            create_template(args.init, args.labels)
            print(f'Created {args.labels}. Enter correct labels before evaluating.')
            return
        # Model imports/loading are unnecessary when creating a template.
        from fashion_tagger import tag_image
        report = evaluate(args.labels, tag_image)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + '\n')
        for field, counts in report['metrics'].items():
            score = f"{counts['accuracy']:.1%}" if counts['accuracy'] is not None else 'not labeled'
            print(f"{field}: {counts['correct']}/{counts['total']} ({score})")
        print(f"Failed images: {report['failed_images']}; details and category confusion: {args.output}")
        if report['failed_images']:
            raise SystemExit(1)
    except (OSError, ValueError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
