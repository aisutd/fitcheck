const assert = require('node:assert/strict');
const { carouselWindow, nextCarouselId, QUIZ_SHOPPING } = require('../src/features/quiz/carouselModel');
const { QUIZ_QUESTIONS } = require('../src/features/quiz/quizModel');
const options = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
assert.deepEqual(carouselWindow(options, 'a').map((entry) => entry.option.id), ['d', 'a', 'b']);
assert.equal(nextCarouselId(options, 'a', -1), 'd');
assert.equal(nextCarouselId(options, 'd', 1), 'a');
assert.deepEqual(carouselWindow([], 'a'), []);
assert.equal(new Set(carouselWindow(options.slice(0, 2), 'a').map((entry) => entry.option.id)).size, 2);
const before = JSON.stringify(options); nextCarouselId(options, 'a', 1); assert.equal(JSON.stringify(options), before);
for (const question of QUIZ_QUESTIONS.filter((item) => ['q5', 'q6', 'q7'].includes(item.id))) {
  for (const option of question.groups[0].options) assert.ok(QUIZ_SHOPPING[option.id], option.id);
}
console.log('Passed carousel wraparound, empty/two-card layout, browse immutability and shopping mapping checks.');
