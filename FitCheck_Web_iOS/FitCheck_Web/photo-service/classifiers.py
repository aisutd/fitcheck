"""Independent attribute heads on the existing FashionCLIP image encoder."""
import os
import warnings
from pathlib import Path
from PIL import ImageOps
from fashion_labels import FIELDS, allowed_labels

from project_paths import MODELS_DIR

DEFAULT_MODELS = MODELS_DIR


def image_embedding(image):
    import torch
    from fashion_tagger import _load_model
    model, processor = _load_model()
    image = ImageOps.exif_transpose(image).convert('RGB')
    inputs = processor(images=image, return_tensors='pt')
    device = next(model.parameters()).device
    with torch.no_grad():
        features = model.get_image_features(**{key: value.to(device) for key, value in inputs.items()})
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()[0]


class AttributePredictor:
    def __init__(self, models_dir=None, embed=image_embedding, model_name=None):
        self.models_dir = Path(models_dir or os.environ.get('FASHION_CLASSIFIERS_DIR', DEFAULT_MODELS))
        self.embed = embed
        self.model_name = model_name or os.environ.get('FASHIONCLIP_MODEL_PATH', 'patrickjohncyh/fashion-clip')
        self.heads = {}
        self.load_errors = {}
        for field in FIELDS:
            path = self.models_dir / f'{field}_classifier.joblib'
            if path.exists():
                import joblib
                from sklearn.exceptions import InconsistentVersionWarning
                with warnings.catch_warnings(record=True) as caught:
                    warnings.simplefilter('always', InconsistentVersionWarning)
                    bundle = joblib.load(path)
                mismatch = next((entry for entry in caught if isinstance(entry.message, InconsistentVersionWarning)), None)
                if mismatch:
                    message = f'{path}: incompatible scikit-learn versions: {mismatch.message}'
                    self.load_errors[field] = message
                    warnings.warn(message + '; using zero-shot fallback in the API', RuntimeWarning)
                    continue
                if bundle['field'] != field or bundle.get('embedding_model', 'patrickjohncyh/fashion-clip') != self.model_name:
                    raise ValueError(f'{path}: classifier/embedding model mismatch')
                if any(label not in allowed_labels(field) for label in bundle['classifier'].classes_):
                    raise ValueError(f'{path}: classifier contains unsupported labels; retrain it')
                self.heads[field] = bundle['classifier']

    def predict(self, image, fields=FIELDS, fallback=None, category=None, item=None):
        unknown = set(fields) - set(FIELDS)
        if unknown:
            raise ValueError(f'Unknown fields: {unknown}')
        results, scores, details = {}, {}, {}
        embedding = None
        def choose(field, category=None, item=None):
            nonlocal embedding
            allowed = allowed_labels(field, category, item)
            if allowed == ['Not Applicable']:
                return 'Not Applicable', None, 'not_applicable'
            head = self.heads.get(field)
            if head is not None:
                if embedding is None:
                    embedding = self.embed(image)
                probabilities = head.predict_proba([embedding])[0]
                candidates = [(float(probability), str(label)) for label, probability in zip(head.classes_, probabilities) if label in allowed]
                if candidates:
                    score, label = max(candidates)
                    return label, score, 'classifier'
            if fallback:
                label, score = fallback(field, allowed)
                return label, score, 'zero_shot'
            return None, None, 'unavailable'
        # Context is predicted even when testing only a dependent attribute.
        from fashion_labels import ITEM_TO_CATEGORY
        if category is None:
            category, score, source = choose('category')
            if category is not None:
                results['category'], scores['category'], details['category'] = category, score, source
        if item is None:
            item, score, source = choose('item', category)
            results['item'], scores['item'], details['item'] = item, score, source
        if category is None and item:
            category = ITEM_TO_CATEGORY[item]
            results['category'], scores['category'], details['category'] = category, None, 'item_mapping'
        for field in fields:
            if field in results:
                continue
            # Do not classify a dependent field without known context.
            if field == 'fit' and category is None:
                value, score, source = None, None, 'context_unavailable'
            elif field == 'category' and category is not None:
                value, score, source = category, None, 'provided'
            elif field == 'item' and item is not None:
                value, score, source = item, None, 'provided'
            else:
                value, score, source = choose(field, category, item)
            results[field], scores[field], details[field] = value, score, source
        return {
            **{field: results.get(field) for field in fields},
            'scores': {field: scores.get(field) for field in fields},
            'predictions': {field: {'value': results.get(field), 'score': scores.get(field), 'source': details.get(field)} for field in fields},
            'context': {'category': category, 'item': item},
        }
