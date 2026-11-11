import csv
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from evaluate_tagger import FIELDS, create_template, evaluate


class EvaluationTests(unittest.TestCase):
    def test_template_and_protection(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            Image.new('RGB', (8, 8)).save(root / 'shirt.jpg')
            labels = root / 'evaluation/labels.csv'
            create_template(root, labels)
            with self.assertRaises(FileExistsError):
                create_template(root, labels)
            with self.assertRaisesRegex(ValueError, 'No manual labels'):
                evaluate(labels, lambda image: {})

    def test_accuracy_missing_labels_errors_and_confusion(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            Image.new('RGB', (8, 8)).save(root / 'shirt.jpg')
            labels = root / 'labels.csv'
            with labels.open('w', newline='') as output:
                writer = csv.DictWriter(output, fieldnames=('image',) + FIELDS)
                writer.writeheader()
                writer.writerow({'image':'shirt.jpg','category':'Hoodies','color':'Brown'})
                writer.writerow({'image':'missing.jpg','category':'Tops'})
                writer.writerow({'image':'shirt.jpg'})
            report = evaluate(labels, lambda image: {'category':'Tops','color':'Brown'})
            self.assertEqual(report['metrics']['category']['accuracy'], 0)
            self.assertEqual(report['metrics']['color']['accuracy'], 1)
            self.assertIsNone(report['metrics']['material']['accuracy'])
            self.assertEqual(report['category_confusion']['Hoodies']['Tops'], 1)
            self.assertEqual(report['failed_images'], 1)
            self.assertEqual(report['labeled_images'], 2)


if __name__ == '__main__':
    unittest.main()
