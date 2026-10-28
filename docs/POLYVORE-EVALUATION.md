# Polyvore category baseline evaluation

This is a measured, offline compatibility baseline using the original Polyvore
metadata. It is not the FitCheck runtime recommendation engine, and is not evidence
that personalized recommendations have 73.5% accuracy.

## Result

| Measure | Value |
| --- | --- |
| Training split outfits | 17,316 |
| Training outfits with distinct category pairs | 17,299 |
| Held-out source outfits | 3,076 |
| Evaluated compatibility examples | 7,061 |
| Compatible / incompatible examples evaluated | 3,061 / 4,000 |
| Excluded rows with no supported distinct category pair | 15 |
| Rows excluded for missing item metadata | 0 |
| Train/test source outfit ID overlap | 0 |
| Category baseline ROC-AUC | 0.735029 |
| Constant-score baseline ROC-AUC | 0.500000 |

AUC measures score ordering between compatible and incompatible labels. It is
threshold-independent and is not classification accuracy, a match percentage,
or a probability that a user will like an outfit.

## Method

1. Learn individual category frequency and category-pair co-occurrence from the
   training split only. Collapse repeated categories within an outfit.
2. Compute each supported pair's smoothed log lift:
   log((pair count + 1) * (training count + 1) /
       ((category A count + 1) * (category B count + 1))).
3. Score a test outfit by the mean of its supported pair scores. Categories never
   seen in training do not create scores. Exclude rows with no supported pairs.
4. Resolve item IDs using the held-out test metadata only. Assert no shared source
   outfit IDs between training and test. Use the supplied compatibility labels.
5. Compute ROC-AUC using average ranks for ties. No classification threshold or
   test-set hyperparameter sweep is used. Validation metadata is not used.

## Observed training patterns

The aggregated report includes pairs with at least 250 co-occurring training
outfits. Examples include T-Shirts / Sneakers (591), Tank Tops / Shorts (421),
and Cocktail Dresses / Pumps (408). These are descriptive dataset associations,
not universal styling rules or evidence about weather, race or individual taste.
Beauty products are also present in the original corpus; this baseline does not
restrict evaluation to FitCheck's top/bottom/shoes categories. Negative sampling
in the source benchmark may make category-level cues easier to exploit.

## Limits and next experiment

The evaluator uses no photos, colors, fits, occasions, skin tones or quiz answers.
Historical item URLs are not fetched. It neither trains a visual model nor changes
the app's priority weights. The original dataset is historical and may not
represent current fashion, users or shopping catalogs.

The next runtime comparison needs a documented mapping from real garment metadata
to these category IDs, an independent validation set, and comparison against the
existing ranking engine plus human feedback. Do not apply the offline score to
app cards or present it as a user-specific confidence measure yet.

## Reproduce

Source: https://github.com/xthan/polyvore-dataset
Archive: https://raw.githubusercontent.com/xthan/polyvore-dataset/master/polyvore.tar.gz
Category names: https://raw.githubusercontent.com/xthan/polyvore-dataset/master/category_id.txt

Download the metadata archive and category_id.txt into a local working folder.
From the archive, extract only train_no_dup.json, test_no_dup.json and
fashion_compatibility_prediction.txt. Then run:

```sh
npm run evaluate:polyvore -- /absolute/path/to/polyvore-data
```

The evaluator prints results and SHA-256 hashes of all four input files. Compare
with docs/evaluation/polyvore-category-report.json. Raw data and product images
are not committed to FitCheck. The numerical report and evaluation code are.

Dataset attribution: Han, Xintong; Wu, Zuxuan; Jiang, Yu-Gang; Davis, Larry S.
“Learning Fashion Compatibility with Bidirectional LSTMs.” ACM Multimedia, 2017.
See the original repository for its license and dataset details.
