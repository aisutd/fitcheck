> Historical audit: Length and Rise have since been retired from the active classification system. This report does not describe current training fields.

# Rise review — no label edits proposed

Reviewed labels.jsonl, the complete LABEL_AUDIT.md, current train_classifier.py, shared applicability rules, and all 11 corresponding bottoms images. No verified product rise descriptions, rise measurements, or wearer-reference photos were found in those inputs. Filenames were used only to locate images.

The training error is expected: all 43 records lack a nonblank rise label. The previous dataset-edit proposal has not been applied.

## Photo-by-photo proposal

Blank means unknown; it is not a Mid-Rise or Not Applicable label.

| Line | Filename | Existing item | Proposed Rise | Evidence limitation |
|---:|---|---|---|---|
| 18 | `woman-blue-long-jean-cn63843522.jpg` | jeans | Leave blank | Waistband, fly and crotch area visible in a flat product image; no scale or body landmarks establish worn waist height. |
| 26 | `khaki-pants.jpg` | pants | Leave blank | Waistband and fly visible; garment proportions alone do not establish low/mid/high rise across sizes and cuts. |
| 29 | `slack-pants.jpg` | pants | Leave blank | Waistband and fly visible; garment proportions alone do not establish low/mid/high rise across sizes and cuts. |
| 30 | `black-jean_0.webp` | jeans | Leave blank | Waistband, fly and crotch area visible in a flat product image; no scale or body landmarks establish worn waist height. |
| 31 | `jean-blue.png` | jeans | Leave blank | Waistband, fly and crotch area visible in a flat product image; no scale or body landmarks establish worn waist height. |
| 37 | `green-shorts.avif` | shorts | Leave blank | Elastic/drawstring waistband visible; short leg length does not establish waistband rise. No wearer reference or measurements. |
| 38 | `istockphoto-1463785097-612x612.jpg` | shorts | Leave blank | Elastic/drawstring waistband visible; short leg length does not establish waistband rise. No wearer reference or measurements. |
| 39 | `jogger-black.avif` | pants | Leave blank | Elastic/drawstring waistband and crotch shape visible; no measurements or wearer landmarks establish a rise class. |
| 40 | `jogger-grey.webp` | pants | Leave blank | Angled product view and elastic waistband; perspective and no body reference prevent a reliable rise class. |
| 41 | `jogger-o.jpg` | pants | Leave blank | Elastic/drawstring waistband and crotch shape visible; no measurements or wearer landmarks establish a rise class. |
| 42 | `shorts-black.avif` | shorts | Leave blank | Elastic/drawstring waistband visible; short leg length does not establish waistband rise. No wearer reference or measurements. |

3 jeans + 5 pants + 3 shorts reviewed. No skirt records exist. Jeans, pants and shorts are relevant waistband garments. Skirts can be evaluated by waist placement using appropriate product/wearer information, but none are present here. The current shared software rule permits applicable Rise values only for pants/jeans; shorts/skirts would require a separately approved applicability change before assigning nonblank rise classes. No code changes are proposed or applied.

## Counts after the proposed action (leave unchanged)

| Rise class | Existing examples | Supported additions | Total |
|---|---:|---:|---:|
| Ultra Low-Rise | 0 | 0 | 0 |
| Low-Rise | 0 | 0 | 0 |
| Mid-Rise | 0 | 0 | 0 |
| High-Rise | 0 | 0 | 0 |
| Ultra High-Rise | 0 | 0 | 0 |

Not Applicable also has 0 existing examples; no such labels are proposed in this rise-specific review. Unknown rises on bottoms should not be converted to Not Applicable.

## Holdout readiness

Not eligible for training: 0 labeled examples and 0 classes. The existing nested script requires at least 2 distinct labels, at least 2 photos per label, and a stratified 25% holdout whose training and test sizes both accommodate all represented classes. Two photos per label alone may not satisfy that split. For example, 3 independently labeled photos in each of 2 classes (6 total) meet its count/split checks; representing all 5 requested classes with 4 photos each (20 total) also meets those checks. These are count examples, not new training records or a claim of useful accuracy. No thresholds were relaxed and no training ran.

## Information needed to resolve blanks

Obtain the verified product rise description, relevant size-specific rise measurement with an agreed classification policy, or a wearer photo showing waistband placement relative to body landmarks. No such information is inferred from image filenames, jean silhouettes or drawstrings.

labels.jsonl SHA-256 (unchanged): `ec6aa5ae004480d0f73f8de00959208faadf194a7cad79c822570faa6e875c43`

Approval status: no label changes proposed. The live dataset remains unchanged.
