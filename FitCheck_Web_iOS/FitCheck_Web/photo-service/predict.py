"""Test one or all available classifier heads on an image."""
import argparse
import json
from pathlib import Path
from PIL import Image
from classifiers import AttributePredictor
from fashion_labels import FIELDS, CATEGORY_LABELS, ITEM_TO_CATEGORY


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--field', choices=(*FIELDS, 'all'), default='all')
    parser.add_argument('--models', type=Path)
    parser.add_argument('--category', choices=CATEGORY_LABELS, help='Optional known context for fit')
    parser.add_argument('--item', choices=list(ITEM_TO_CATEGORY), help='Optional known item context')
    args = parser.parse_args()
    try:
        predictor = AttributePredictor(args.models)
        fields = list(predictor.heads) if args.field == 'all' else [args.field]
        if not fields or any(field not in predictor.heads for field in fields):
            raise ValueError('; '.join(predictor.load_errors.values()) or 'Requested classifier files are missing; train them first')
        category = args.category
        if args.item:
            mapped = ITEM_TO_CATEGORY[args.item]
            if category and category != mapped:
                raise ValueError('--item and --category disagree')
            category = category or mapped
        with Image.open(args.image) as image:
            print(json.dumps(predictor.predict(image, fields, category=category, item=args.item), indent=2))
    except (OSError, ValueError, ImportError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
