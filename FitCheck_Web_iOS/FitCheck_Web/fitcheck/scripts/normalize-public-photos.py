"""Convert AVIF and repair mislabeled JPEG/PNG assets before Metro reads them."""
import argparse
import hashlib
import io
from pathlib import Path
from PIL import Image, ImageOps


def normalize(folder):
    folder = Path(folder)
    backup_dir = folder.parent.parent / '.expo/original-photos'
    for source in sorted(folder.iterdir()):
        suffix = source.suffix.lower()
        if not source.is_file() or suffix not in {'.avif', '.jpg', '.jpeg', '.png', '.webp', '.gif'}:
            continue
        original = source.read_bytes()
        digest = hashlib.sha256(original).hexdigest()
        try:
            with Image.open(io.BytesIO(original)) as image:
                if suffix == '.avif':
                    # A separate, content-addressed output preserves the original
                    # and cannot overwrite another photo with the same stem.
                    target = source.with_name(f'{source.stem}-avif-{digest[:12]}.png')
                    output_format = 'PNG'
                else:
                    expected = {'.jpg': 'JPEG', '.jpeg': 'JPEG', '.png': 'PNG', '.webp': 'WEBP', '.gif': 'GIF'}[suffix]
                    if image.format == expected:
                        image.verify()
                        continue
                    target = source
                    output_format = expected
                output = io.BytesIO()
                corrected = ImageOps.exif_transpose(image)
                corrected = corrected.convert('RGB' if output_format == 'JPEG' else 'RGBA')
                corrected.save(output, format=output_format)
                data = output.getvalue()
        except (OSError, ValueError) as error:
            raise ValueError(f'{source.name}: could not read/convert image: {error}') from error
        if target.exists() and target.read_bytes() == data:
            continue
        if target == source:
            backup_dir.mkdir(parents=True, exist_ok=True)
            backup = backup_dir / f'{digest}{suffix}'
            if not backup.exists():
                backup.write_bytes(original)
        elif target.exists():
            raise ValueError(f'Conversion output already exists with different contents: {target.name}')
        temp = target.with_name(target.name + '.converting')
        try:
            temp.write_bytes(data)
            temp.replace(target)
        finally:
            temp.unlink(missing_ok=True)
        print(f'Converted {source.name} → {target.name}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    args = parser.parse_args()
    try:
        normalize(args.folder)
    except (OSError, ValueError) as error:
        parser.exit(1, f'{error}\n')
