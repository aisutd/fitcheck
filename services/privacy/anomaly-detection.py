"""
Account-activity burst detector (Isolation Forest).

Adapted from the Kaggle "Anomaly Detection with Isolation Forest" notebook on the
credit card fraud dataset. Same idea, different unit of analysis:

    notebook:  one row = one transaction   -> features = amount, V1..V28, ...
    this file: one row = one account in one 5-minute window
               -> features = requests, peak requests/min, endpoints hit, error ratio, failed logins

Differences from the notebook, and why:
  * The notebook sets `contamination = known fraud fraction`, which hard-wires the alert
    rate. In a real app you don't know it, so we train unsupervised and pick the
    score THRESHOLD ourselves using simulated test data (step 4 of your instructions).
  * We train on normal-looking traffic, then tune on one simulated set and
    confirm on a second set the tuning never saw.

Run:  python anomaly-detection.py
Needs: numpy, pandas, scikit-learn, joblib
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib

WINDOW = "5min"
FEATURES = ["log_requests", "log_peak_per_min", "log_endpoints", "error_ratio", "log_failed_logins"]


# --------------------------------------------------------------------------- #
# 1. Turn raw request logs into one row per (account, 5-minute window)
#    Expected columns: account_id, timestamp, endpoint, status, is_login_failure(bool)
#    This is the function you point at your real app's logs.
# --------------------------------------------------------------------------- #
def build_features(events: pd.DataFrame) -> pd.DataFrame:
    ev = events.copy()
    ev["timestamp"] = pd.to_datetime(ev["timestamp"], utc=True)
    ev["window"] = ev["timestamp"].dt.floor(WINDOW)
    ev["minute"] = ev["timestamp"].dt.floor("1min")
    ev["is_error"] = ev["status"] >= 400

    per_minute = ev.groupby(["account_id", "window", "minute"]).size()
    peak = per_minute.groupby(["account_id", "window"]).max().rename("peak_per_min")

    g = ev.groupby(["account_id", "window"])
    out = pd.DataFrame({
        "requests": g.size(),
        "endpoints": g["endpoint"].nunique(),
        "error_ratio": g["is_error"].mean(),
        "failed_logins": g["is_login_failure"].sum(),
    }).join(peak)

    out["log_requests"] = np.log1p(out["requests"])
    out["log_peak_per_min"] = np.log1p(out["peak_per_min"])
    out["log_endpoints"] = np.log1p(out["endpoints"])
    out["log_failed_logins"] = np.log1p(out["failed_logins"])
    return out.reset_index()


# --------------------------------------------------------------------------- #
# 2. The detector. Isolation Forest gives every row a score; LOWER = more unusual.
#    We flag a row when its score drops below `threshold`.
# --------------------------------------------------------------------------- #
class BurstDetector:
    def __init__(self, n_estimators=200, random_state=42):
        # contamination="auto" -> we do NOT bake in an expected alert rate
        self.model = IsolationForest(
            n_estimators=n_estimators, contamination="auto", random_state=random_state
        )
        self.threshold = None

    def fit(self, feats: pd.DataFrame):
        self.model.fit(feats[FEATURES])
        return self

    def score(self, feats: pd.DataFrame) -> np.ndarray:
        return self.model.score_samples(feats[FEATURES])  # lower = weirder

    def predict(self, feats: pd.DataFrame) -> np.ndarray:
        if self.threshold is None:
            raise RuntimeError("Call tune_threshold() or set .threshold first")
        return self.score(feats) < self.threshold

    def tune_threshold(self, feats, is_burst, max_false_alarm_rate=0.005, min_burst_recall=0.95):
        """
        Sweep thresholds on labeled simulated data and pick the most sensitive one whose
        false-alarm rate on normal traffic stays under `max_false_alarm_rate`.
        Reports whether the recall target was met.
        """
        s = self.score(feats)
        is_burst = np.asarray(is_burst, dtype=bool)
        normal_scores, burst_scores = s[~is_burst], s[is_burst]

        # Most sensitive threshold allowed = the max_false_alarm_rate quantile of NORMAL scores
        t = np.quantile(normal_scores, max_false_alarm_rate)
        recall = (burst_scores < t).mean()
        self.threshold = float(t)
        return {"threshold": self.threshold, "burst_recall": float(recall),
                "meets_recall_target": bool(recall >= min_burst_recall)}

    def save(self, path):
        joblib.dump(self, path)

    @staticmethod
    def load(path):
        return joblib.load(path)


# --------------------------------------------------------------------------- #
# 3. Simulated test data: realistic normal usage + obviously fake bursts
# --------------------------------------------------------------------------- #
ENDPOINTS = [f"/api/{n}" for n in
             ["feed", "profile", "search", "settings", "messages", "upload", "notifications",
              "friends", "stats", "export", "billing", "help"]]


def simulate_events(n_accounts=300, days=2, burst_accounts_frac=0.04, seed=0):
    rng = np.random.default_rng(seed)
    start = pd.Timestamp("2026-01-01")
    rows, labels = [], []   # labels = (account_id, window) that contain an injected burst

    for acct in range(n_accounts):
        base_rate = rng.lognormal(mean=-0.2, sigma=0.7)        # req/min while active; some users are heavier
        n_sessions = rng.integers(2, 7) * days
        for _ in range(n_sessions):
            s_start = start + pd.Timedelta(minutes=float(rng.uniform(0, days * 1440 - 40)))
            length = int(rng.integers(3, 35))                  # session length in minutes
            counts = rng.poisson(base_rate, size=length)
            counts = np.minimum(counts, 25)                    # humans can't click infinitely fast
            fav = rng.choice(ENDPOINTS, size=rng.integers(2, 6), replace=False)
            for m, c in enumerate(counts):
                if c == 0:
                    continue
                ts = s_start + pd.Timedelta(minutes=m) + pd.to_timedelta(rng.uniform(0, 60, c), unit="s")
                rows.append(pd.DataFrame({
                    "account_id": acct, "timestamp": ts,
                    "endpoint": rng.choice(fav, c),
                    "status": rng.choice([200, 304, 404, 500], c, p=[.90, .07, .025, .005]),
                    "is_login_failure": rng.random(c) < 0.002,
                }))

    # Inject fake bursts into a few accounts: scraper / credential-stuffing / runaway script
    n_bad = int(n_accounts * burst_accounts_frac)
    for acct in rng.choice(n_accounts, n_bad, replace=False):
        for _ in range(int(rng.integers(1, 4))):
            kind = rng.choice(["scraper", "stuffing", "runaway"])
            b_start = start + pd.Timedelta(minutes=float(rng.uniform(0, days * 1440 - 10)))
            length = int(rng.integers(2, 6))
            rate = {"scraper": rng.integers(60, 200), "stuffing": rng.integers(30, 90),
                    "runaway": rng.integers(80, 250)}[kind]
            for m in range(length):
                c = int(rate)
                ts = b_start + pd.Timedelta(minutes=m) + pd.to_timedelta(rng.uniform(0, 60, c), unit="s")
                if kind == "scraper":      # hits everything, mostly fine
                    ep, st, lf = rng.choice(ENDPOINTS, c), rng.choice([200, 404], c, p=[.9, .1]), np.zeros(c, bool)
                elif kind == "stuffing":   # hammering login, mostly failing
                    ep, st = np.array(["/api/login"] * c), rng.choice([200, 401], c, p=[.05, .95])
                    lf = st == 401
                else:                      # one endpoint, in a tight loop
                    ep, st, lf = np.array(["/api/search"] * c), np.full(c, 200), np.zeros(c, bool)
                rows.append(pd.DataFrame({"account_id": acct, "timestamp": ts, "endpoint": ep,
                                          "status": st, "is_login_failure": lf}))
                # Every actual request window gets a label, including minute
                # batches that straddle a five-minute boundary.
                labels.extend((acct, window) for window in ts.floor(WINDOW).unique())

    events = pd.concat(rows, ignore_index=True)
    lab = pd.DataFrame(labels, columns=["account_id", "t"])
    lab["window"] = pd.to_datetime(lab["t"], utc=True).dt.floor(WINDOW)
    lab = lab[["account_id", "window"]].drop_duplicates().assign(is_burst=True)
    return events, lab


def labeled_features(seed):
    events, lab = simulate_events(seed=seed)
    feats = build_features(events).merge(lab, on=["account_id", "window"], how="left")
    feats["is_burst"] = feats["is_burst"].fillna(False).astype(bool)
    return feats


def report(name, feats, flags):
    y = feats["is_burst"].to_numpy()
    tp, fp = int((flags & y).sum()), int((flags & ~y).sum())
    fn = int((~flags & y).sum())
    print(f"{name:<34} caught {tp}/{tp+fn} bursts | false alarms {fp} of {int((~y).sum())} "
          f"normal windows ({fp/max(1,(~y).sum()):.2%})")


# --------------------------------------------------------------------------- #
# 4. Tune on one simulated set, confirm on a fresh one
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    print('Generating normal training traffic...', flush=True)
    train_events, _ = simulate_events(seed=1, burst_accounts_frac=0)
    train_feats = build_features(train_events)
    print('Generating threshold-tuning traffic...', flush=True)
    tune_feats = labeled_features(seed=2)
    print('Generating held-out test traffic...', flush=True)
    test_feats = labeled_features(seed=3)   # never seen during tuning

    print('Training Isolation Forest...', flush=True)
    # This demo trains on simulated normal traffic; no real-user data is used.
    det = BurstDetector().fit(train_feats)

    # Baseline = what the notebook's default behaviour (sklearn's built-in cutoff) does here
    baseline_flags = det.model.predict(test_feats[FEATURES]) == -1
    report("Default cutoff (no tuning)", test_feats, baseline_flags)

    # Tuned threshold
    info = det.tune_threshold(tune_feats, tune_feats["is_burst"],
                              max_false_alarm_rate=0.002, min_burst_recall=0.95)
    print("\nTuned:", {k: (round(v, 4) if isinstance(v, float) else v) for k, v in info.items()})
    report("Tuned threshold (held-out test)", test_feats, det.predict(test_feats))

    det.save("burst_detector.joblib")
    print("\nSaved model + threshold to burst_detector.joblib")
