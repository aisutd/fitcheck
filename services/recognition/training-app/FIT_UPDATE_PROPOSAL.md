# Updated Fit proposal — approval required

Six newly added images were visually reviewed in fitcheck/public/item-photos/. They support silhouette labels in the existing Fit taxonomy. This update supersedes the previous five-example holdout assessment in FIT_REVIEW.md. No copying, dataset changes, model training or architecture changes have occurred.

## Existing five proposed Fit additions

| File | Proposed Fit |
|---|---|
| `woman-blue-long-jean-cn63843522.jpg` | Wide-Leg |
| `purple-dress.jpg` | Fit-and-Flare |
| `red-dress.jpg` | Fit-and-Flare |
| `jean-blue.png` | Wide-Leg |
| `jogger-black.avif` | Jogger |

## Six proposed new records

Copy each source image from fitcheck/public/item-photos/ to training-app/photos/ only on approval. Each filename will be retained. These proposed item/category/color values come from the visible images, not their filenames. Material and Design remain unlabeled.

| File | Item | Category | Color | Fit | Visible evidence |
|---|---|---|---|---|---|
| `blackpants.jpeg` | pants | Bottoms | Black | Wide-Leg | Broad leg panels remain wide through the hems. |
| `whitepants.jpeg` | pants | Bottoms | Beige | Wide-Leg | Broad pleated trouser legs with wide hems; visible color is cream/beige. |
| `browndress.jpeg` | dress | Dresses | Brown | Fit-and-Flare | Defined waist, shaped bodice and outward-flaring skirt. |
| `shopping.jpeg` | dress | Dresses | Blue | Fit-and-Flare | Shaped bodice and defined waist above a flared skirt. |
| `brownjoggers.jpeg` | pants | Bottoms | Brown | Jogger | Elastic waistband and visibly gathered ankle cuffs. |
| `whitejogger.jpeg` | pants | Bottoms | White | Jogger | Elastic waistband and visibly gathered ankle cuffs. |

## Projected Fit counts

| Fit | Photos |
|---|---:|
| Wide-Leg | 4 |
| Fit-and-Flare | 4 |
| Jogger | 3 |

Actual existing-script split check: 8 training examples and 3 holdout examples with test_size=0.25, random_state=42, stratify=labels. All three classes occur in both partitions. Minimum count/split checks pass. This is not a prediction-quality claim; collect varied independent garment examples and keep near-duplicate views/products within one partition.

All other uncertain Fit values remain blank, including footwear. Four existing jacket-category mismatches remain separate, unapproved corrections; the parent train.py validator will still reject those rows until corrected. The nested trainer’s Fit count/split requirements pass for this proposal.

Live labels.jsonl SHA-256 (unchanged): `ec6aa5ae004480d0f73f8de00959208faadf194a7cad79c822570faa6e875c43`

Approve copying the six new photos, adding these six records and applying the five existing Fit additions. No other annotations will be changed.
