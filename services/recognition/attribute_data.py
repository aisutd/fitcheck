"""Validate explicit human labels. Image paths are never used as labels."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps
from fashion_labels import FIELDS, FIELD_LABELS, ITEM_TO_CATEGORY, allowed_labels


def read_labels(path):
    path = Path(path)
    rows = []
    seen = set()
    for number, line in enumerate(path.read_text().splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            if not isinstance(row, dict):
                raise ValueError('requires a JSON object')
            key = 'image' if 'image' in row else 'filename'
            if not isinstance(row.get(key), str) or not row[key].strip():
                raise ValueError('requires an image path or a filename in photos/')
            if 'image' in row and 'filename' in row:
                raise ValueError('use image or filename, not both')
            unknown = set(row) - {'image', 'filename', 'length', 'rise', *FIELDS}
            if unknown:
                raise ValueError(f'unknown fields: {sorted(unknown)}')
            labels = {}
            for field in FIELDS:
                value = row.get(field)
                if value is None:
                    continue
                if not isinstance(value, str):
                    raise ValueError(f'{field} must be a string or null')
                value = value.strip()
                if not value:
                    continue
                if value not in FIELD_LABELS[field]:
                    raise ValueError(f'unsupported {field}: {value!r}')
                labels[field] = value
            category, item = labels.get('category'), labels.get('item')
            if category and item and ITEM_TO_CATEGORY[item] != category:
                raise ValueError('item and category disagree')
            # Category can constrain validation without becoming a training label.
            context = category or ITEM_TO_CATEGORY.get(item)
            for field in ('fit',):
                value = labels.get(field)
                if value and context and value not in allowed_labels(field, context, item):
                    raise ValueError(f'{field} {value!r} is incompatible with category/item')
            image_root = path.parent / 'photos' if key == 'filename' else path.parent
            image_path = (image_root / row[key].strip()).resolve()
            if key == 'filename' and not image_path.is_relative_to(image_root.resolve()):
                raise ValueError('filename must refer to a file inside photos/')
            with Image.open(image_path) as image:
                pixels = ImageOps.exif_transpose(image).convert('RGB')
                digest = hashlib.sha256(str(pixels.size).encode() + pixels.tobytes()).hexdigest()
            if digest in seen:
                raise ValueError('duplicate decoded image; avoid holdout leakage')
            seen.add(digest)
            rows.append({'path': image_path, 'labels': labels, 'hash': digest, 'line': number})
        except (ValueError, OSError) as error:
            raise ValueError(f'{path}:{number}: {error}') from error
    if not rows:
        raise ValueError(f'{path}: no images with manually supplied records')
    return rows
