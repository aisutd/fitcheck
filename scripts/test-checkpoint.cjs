const assert = require('node:assert/strict');
const { evaluateCheckpoint } = require('../src/features/evaluation/checkpointEvaluation');
const report = evaluateCheckpoint();
for (const scenario of report.cases) {
  assert.ok(scenario.personalizedMatchesScenario, scenario.scenario);
  assert.ok(scenario.wardrobeAndOccasionValid, `${scenario.scenario}: owned items and Date Night tags`);
}
assert.notDeepEqual(report.cases[0].personalizedItems, report.cases[1].personalizedItems, 'contrasting cold-weather answers must change the top result');
console.log(`Passed ${report.passed}/${report.total} controlled checkpoint scenarios and contrasting-profile check.`);
