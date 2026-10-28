import csv
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from train_categories import read_examples, validate_splits


class TrainingDataTests(unittest.TestCase):
    def test_load_labels_and_reject_overlap(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name, color in [('hoodie', 'brown'), ('sweater', 'blue')]:
                Image.new('RGB', (8, 8), color).save(root / f'{name}.png')
            labels = root / 'train.csv'
            labels.write_text('image,category\nhoodie.png,Outerwear\nsweater.png,Tops\n')
            rows = read_examples(labels)
            self.assertEqual(len(rows), 2)
            with self.assertRaisesRegex(ValueError, 'same image'):
                validate_splits(rows, rows)
            with self.assertRaisesRegex(ValueError, 'at least two'):
                validate_splits(rows[:1], [{**rows[1], 'hash': 'different'}])

    def test_empty_unknown_and_duplicate_labels(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            Image.new('RGB', (8, 8)).save(root / 'image.png')
            labels = root / 'labels.csv'
            for contents, error in [
                ('image,category\nimage.png,\n', 'no labeled'),
                ('image,category\nimage.png,Invalid\n', 'unsupported category'),
                ('image,category\nimage.png,Tops\nimage.png,Tops\n', 'duplicate image'),
            ]:
                labels.write_text(contents)
                with self.assertRaisesRegex(ValueError, error):
                    read_examples(labels)


if __name__ == '__main__':
    unittest.main()
