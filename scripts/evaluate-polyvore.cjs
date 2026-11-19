const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
const { trainCategoryModel, categoryCompatibility, rocAuc } = require('../src/features/evaluation/polyvoreCompatibility');
const directory = process.argv[2];
if (!directory) throw new Error('Usage: node scripts/evaluate-polyvore.cjs PATH_TO_POLYVORE_METADATA');
const files = ['train_no_dup.json', 'test_no_dup.json', 'fashion_compatibility_prediction.txt', 'category_id.txt'];
const raw = Object.fromEntries(files.map((file) => [file, readFileSync(join(directory, file))]));
const train = JSON.parse(raw['train_no_dup.json']);
const test = JSON.parse(raw['test_no_dup.json']);
const trainIds = new Set(train.map((outfit) => String(outfit.set_id)));
if (test.some((outfit) => trainIds.has(String(outfit.set_id)))) throw new Error('Train/test outfit ID overlap; evaluation stopped.');
const items = new Map();
for (const outfit of test) for (const item of outfit.items) items.set(`${outfit.set_id}_${item.index}`, String(item.categoryid));
const model = trainCategoryModel(train);
const rows = [];
let skippedMissingMetadata = 0;
let skippedNoSupportedPairs = 0;
for (const line of raw['fashion_compatibility_prediction.txt'].toString().trim().split(/\r?\n/)) {
  const [label, ...ids] = line.trim().split(/\s+/);
  if (!['0', '1'].includes(label) || ids.some((id) => !items.has(id))) { skippedMissingMetadata += 1; continue; }
  const score = categoryCompatibility(ids.map((id) => items.get(id)), model);
  if (score === null) { skippedNoSupportedPairs += 1; continue; }
  rows.push({ label: Number(label), score });
}
const summary = (label) => {
  const group = rows.filter((row) => row.label === label);
  return { count: group.length, meanScore: group.reduce((sum, row) => sum + row.score, 0) / group.length };
};
const categoryNames = new Map(raw['category_id.txt'].toString().trim().split(/\r?\n/).map((line) => {
  const split = line.indexOf(' '); return [line.slice(0, split), line.slice(split + 1)];
}));
const supportedPairs = [...model.pairs.entries()].filter(([, count]) => count >= 250).map(([key, count]) => {
  const ids = key.split('|');
  return { categories: ids.map((id) => categoryNames.get(id) || id), cooccurringTrainingOutfits: count, logLift: categoryCompatibility(ids, model) };
}).sort((a, b) => b.logLift - a.logLift).slice(0, 10);
console.log(JSON.stringify({
  source: 'https://github.com/xthan/polyvore-dataset',
  method: 'Smoothed category-pair log lift, averaged over distinct category pairs; trained only on training outfits',
  trainingOutfits: train.length, trainingOutfitsWithDistinctCategoryPairs: model.count, heldOutOutfits: test.length, trainingTestOutfitIdOverlap: 0,
  evaluatedRows: rows.length, skippedRows: skippedMissingMetadata + skippedNoSupportedPairs, skippedMissingMetadata, skippedNoSupportedPairs, compatible: summary(1), incompatible: summary(0),
  rocAuc: rocAuc(rows), constantScoreBaselineAuc: rocAuc(rows.map((row) => ({ ...row, score: 0 }))),
  frequentTrainingPairs: supportedPairs,
  limitations: [
    'Offline category-only baseline; not the app runtime recommender or a trained visual model.',
    'No personal preference, weather, occasion, image or color labels are evaluated.',
    'Repeated categories are collapsed; unsupported pairs are skipped; item identities and arrangement are ignored.',
    'No threshold is tuned on the test labels. Original dataset negative construction may favor category-level cues.',
    'Dataset is historical and does not establish performance on current users or retailers.',
  ],
  sha256: Object.fromEntries(files.map((file) => [file, createHash('sha256').update(raw[file]).digest('hex')])),
}, null, 2));
