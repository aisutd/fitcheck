"""Adapter for the existing model; artifacts contain sklearn objects, not __main__ classes."""
import importlib.util
from pathlib import Path

import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("fitcheck_detector", HERE / "anomaly-detection.py")
detector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(detector)


class ActivityModel:
    def __init__(self, artifact=HERE / "activity_model.joblib"):
        saved = joblib.load(artifact) if artifact.exists() else {}
        self.features = ['log_requests', 'log_peak_per_min']
        if saved.get('version') == 2:
            # Only load locally generated/trusted joblib files.
            self.model, self.threshold = saved['model'], saved['threshold']
        else:
            print('Preparing demo activity model from synthetic traffic...', flush=True)
            normal, _ = detector.simulate_events(n_accounts=60, days=1, burst_accounts_frac=0, seed=11)
            events, _ = detector.simulate_events(n_accounts=60, days=1, burst_accounts_frac=0, seed=12)
            # This gateway observes request volume, not login failures. Use only
            # the features it can actually measure, rather than inventing them.
            self.model = IsolationForest(n_estimators=200, contamination='auto', random_state=42)
            self.model.fit(detector.build_features(normal)[self.features])
            scores = self.model.score_samples(detector.build_features(events)[self.features])
            self.threshold = float(np.quantile(scores, 0.005))
            joblib.dump({'version': 2, 'model': self.model, 'threshold': self.threshold}, artifact)

    def score(self, events):
        features = detector.build_features(pd.DataFrame(events))
        scores = self.model.score_samples(features[self.features])
        return [{
            'window': row.window.isoformat(), 'requests': int(row.requests),
            'score': float(score), 'threshold': float(self.threshold),
            'suspicious': bool(score < self.threshold),
        } for row, score in zip(features.itertuples(), scores)]
