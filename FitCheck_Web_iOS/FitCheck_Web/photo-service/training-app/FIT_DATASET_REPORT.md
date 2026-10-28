# Approved Fit dataset update

Applied five Fit additions to existing records and added six approved photos/records. All previous annotation values were preserved.

| Fit | Photos | Training | Holdout |
|---|---:|---:|---:|
| Wide-Leg | 4 | 3 | 1 |
| Fit-and-Flare | 4 | 3 | 1 |
| Jogger | 3 | 2 | 1 |

49 records total; 11 Fit-labeled and 38 Fit-unlabeled. `load_records("fit")` passed. The existing stratified 25% holdout split passed: 8 training / 3 holdout. Minimum data checks pass; this does not establish prediction accuracy. No training was performed and no models were changed.

Original annotations backed up to `labels.before-fit-update.jsonl`. Existing four jacket-category mismatches remain unchanged and still block the separate parent trainer’s full-schema validation.
