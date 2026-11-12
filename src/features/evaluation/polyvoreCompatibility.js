function pairKey(a, b) { return [String(a), String(b)].sort().join('|'); }
function trainCategoryModel(outfits) {
  const singles = new Map();
  const pairs = new Map();
  let count = 0;
  for (const outfit of outfits) {
    const categories = [...new Set(outfit.items.map((item) => String(item.categoryid)))];
    if (categories.length < 2) continue;
    count += 1;
    for (const category of categories) singles.set(category, (singles.get(category) || 0) + 1);
    for (let i = 0; i < categories.length; i += 1) {
      for (let j = i + 1; j < categories.length; j += 1) {
        const key = pairKey(categories[i], categories[j]);
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }
  return { count, singles, pairs };
}
function categoryCompatibility(categories, model) {
  const unique = [...new Set(categories.map(String))];
  let score = 0;
  let n = 0;
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const a = unique[i]; const b = unique[j];
      if (!model.singles.has(a) || !model.singles.has(b)) continue;
      score += Math.log(((model.pairs.get(pairKey(a, b)) || 0) + 1) * (model.count + 1) /
        (((model.singles.get(a) || 0) + 1) * ((model.singles.get(b) || 0) + 1)));
      n += 1;
    }
  }
  return n ? score / n : null;
}
// Mann–Whitney rank statistic with average ranks for ties.
function rocAuc(rows) {
  const sorted = [...rows].sort((a, b) => a.score - b.score);
  const positives = sorted.filter((row) => row.label === 1).length;
  const negatives = sorted.length - positives;
  if (!positives || !negatives) return null;
  let rankSum = 0;
  for (let i = 0; i < sorted.length;) {
    let end = i + 1;
    while (end < sorted.length && sorted[end].score === sorted[i].score) end += 1;
    const averageRank = (i + 1 + end) / 2;
    for (let j = i; j < end; j += 1) if (sorted[j].label === 1) rankSum += averageRank;
    i = end;
  }
  return (rankSum - positives * (positives + 1) / 2) / (positives * negatives);
}
module.exports = { trainCategoryModel, categoryCompatibility, rocAuc };
