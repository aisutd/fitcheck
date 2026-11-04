"""Synthetic fixtures verify plumbing; they are not clothing training data."""
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
from PIL import Image
from attribute_data import read_labels
from classifiers import AttributePredictor
from fashion_labels import FIELDS, FIELD_LABELS, allowed_labels
from train import train_field, split_rows


class StubHead:
    def __init__(self, labels, probabilities):
        self.classes_ = labels
        self.probabilities = probabilities

    def predict_proba(self, embeddings):
        return [self.probabilities]


class AttributeTests(unittest.TestCase):
    def fixture(self, root, **labels):
        path = root / 'misleading-name-shoes.jpg'
        Image.new('RGB', (5, 5), 'red').save(path)
        source = root / 'labels.jsonl'
        source.write_text(json.dumps({'image': path.name, **labels}) + '\n')
        return source

    def test_missing_labels_are_not_invented_from_paths(self):
        with tempfile.TemporaryDirectory() as folder:
            source = self.fixture(Path(folder), color='Red', item=' ', category=None)
            self.assertEqual(read_labels(source)[0]['labels'], {'color': 'Red'})

    def test_validation(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for values in [dict(category='Accessories'), dict(category='Socks'),
                           dict(category='Tops', item='boots'),
                           dict(category='Shoes', fit='Skinny'),
                           dict(color=42)]:
                with self.subTest(values=values), self.assertRaises(ValueError):
                    read_labels(self.fixture(root, **values))
            source = self.fixture(root, item='pants')
            self.assertNotIn('category', read_labels(source)[0]['labels'])
            source.write_text(source.read_text() * 2)
            with self.assertRaisesRegex(ValueError, 'duplicate'):
                read_labels(source)

    def test_moved_training_paths_and_filename_records(self):
        from project_paths import SERVICE_DIR, TRAINING_DIR, PHOTO_DIR, LABELS_FILE, MODELS_DIR
        from classifiers import DEFAULT_MODELS
        self.assertEqual(TRAINING_DIR, SERVICE_DIR / 'training-app')
        self.assertEqual(PHOTO_DIR, TRAINING_DIR / 'photos')
        self.assertEqual(LABELS_FILE, TRAINING_DIR / 'labels.jsonl')
        self.assertEqual(DEFAULT_MODELS, MODELS_DIR)
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'photos').mkdir()
            Image.new('RGB', (5, 5), 'red').save(root / 'photos' / 'photo.png')
            source = root / 'labels.jsonl'
            source.write_text(json.dumps({'filename': 'photo.png', 'color': 'Red'}) + '\n')
            rows = read_labels(source)
            self.assertEqual(rows[0]['path'], (root / 'photos' / 'photo.png').resolve())
            self.assertEqual(rows[0]['labels'], {'color': 'Red'})
            source.write_text(json.dumps({'filename': '../outside.png', 'color': 'Red'}) + '\n')
            with self.assertRaisesRegex(ValueError, 'inside photos'):
                read_labels(source)

    def test_incompatible_moved_classifier_does_not_break_fallback(self):
        import warnings
        from sklearn.exceptions import InconsistentVersionWarning
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'item_classifier.joblib').touch()
            def incompatible_load(path):
                warnings.warn(InconsistentVersionWarning(
                    estimator_name='LogisticRegression', current_sklearn_version='old',
                    original_sklearn_version='new'))
                return {}
            with patch('joblib.load', side_effect=incompatible_load), self.assertWarns(RuntimeWarning):
                predictor = AttributePredictor(root)
            self.assertFalse(predictor.heads)
            self.assertIn('item', predictor.load_errors)
            result = predictor.predict(None, ['item'], fallback=lambda field, labels: (labels[0], .5))
            self.assertEqual(result['predictions']['item']['source'], 'zero_shot')

    def predictor(self):
        predictor = AttributePredictor('/nonexistent/models', embed=lambda image: np.array([1., 0.]))
        predictor.heads = {
            'category': StubHead(['Shoes', 'Bottoms'], [.8, .2]),
            'item': StubHead(['pants', 'boots'], [.9, .1]),
            'fit': StubHead(['Skinny', 'Wide'], [.99, .01]),
        }
        return predictor

    def test_category_constraints_and_missing_context(self):
        predictor = self.predictor()
        result = predictor.predict(None)
        self.assertEqual(result['item'], 'boots')
        self.assertEqual(result['fit'], 'Wide')
        self.assertIsNone(result['color'])
        self.assertEqual(set(result['predictions']), set(FIELDS))
        self.assertNotIn('length', result)
        self.assertNotIn('rise', result)
        predictor.heads = {}
        self.assertEqual(predictor.predict(None, ['fit'])['predictions']['fit']['source'], 'context_unavailable')
        for retired in ('length', 'rise'):
            with self.assertRaises(ValueError):
                predictor.predict(None, [retired])

    def test_retired_model_files_are_not_loaded(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('length', 'rise'):
                (root / f'{name}_classifier.joblib').write_bytes(b'not a model')
            self.assertEqual(AttributePredictor(root).heads, {})
            source = self.fixture(root, color='Red', length='Long', rise='High-Rise')
            self.assertEqual(read_labels(source)[0]['labels'], {'color': 'Red'})

    def test_every_attribute_trains_saves_loads_and_reports(self):
        # Intentionally synthetic data: all generated models stay in a temp dir.
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            rows = []
            for index in range(8):
                path = root / f'{index}.png'
                Image.new('RGB', (5, 5), (index * 25, 0, 0)).save(path)
                rows.append({'path': path, 'labels': {field: FIELD_LABELS[field][index % 2] for field in FIELDS}})
            rows.append({'path': root / 'unused.png', 'labels': {}})
            def embed(image):
                return np.array([image.getpixel((0, 0))[0] / 255., 1.])
            for field in FIELDS:
                with self.subTest(field=field):
                    report = train_field(rows, field, root / 'models', embed=embed)
                    self.assertEqual(report['skipped_blank'], 1)
                    self.assertTrue((root / 'models' / f'{field}_classifier.joblib').is_file())
                    self.assertIn('classification_report', report)
                    self.assertFalse(set(report['training_images']) & set(report['holdout_images']))
            loaded = AttributePredictor(root / 'models', embed=embed)
            self.assertEqual(set(loaded.heads), set(FIELDS))
            result = loaded.predict(Image.new('RGB', (5, 5)), ['color'])
            self.assertEqual(result['predictions']['color']['source'], 'classifier')
            with self.assertRaisesRegex(ValueError, 'mismatch'):
                AttributePredictor(root / 'models', model_name='different')
            with self.assertRaises(ValueError):
                split_rows(rows[:1], 'color')

    def test_api_keeps_flat_tags_and_structured_predictions(self):
        import server
        result = self.predictor().predict(None)
        image = io.BytesIO()
        Image.new('RGB', (5, 5)).save(image, format='PNG')
        with patch.object(server.fashion_tagger, 'tag_image', return_value=result):
            response = server.app.test_client().post('/tag', data={'photo': (io.BytesIO(image.getvalue()), 'pants.png')})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['item'], 'boots')
        self.assertEqual(set(response.json['predictions']), set(FIELDS))
        self.assertEqual(server.app.test_client().post('/tag').status_code, 400)


if __name__ == '__main__':
    unittest.main()
