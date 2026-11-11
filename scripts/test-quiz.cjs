const assert = require('node:assert/strict');
const {
  QUIZ_QUESTIONS,
  QUIZ_SCHEMA_VERSION,
  createBlankAnswers,
  hasAnyAnswer,
  isOptionSelected,
  movePriority,
  toggleMultipleChoice,
  updateGroupAnswer,
  validateAnswers,
  validateDraft,
  validateProfile,
} = require('../src/features/quiz/quizModel');

let checks = 0;

function check(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}

function makeCompleteAnswers() {
  let answers = createBlankAnswers();
  answers = updateGroupAnswer(answers, 'q1', 'styles', ['minimalist', 'classic']);
  answers = updateGroupAnswer(answers, 'q2', 'fits', ['regular']);
  answers = updateGroupAnswer(answers, 'q4', 'priorities', ['comfort', 'style', 'weather']);
  return answers;
}

check(QUIZ_QUESTIONS.length === 10, 'the quiz must contain exactly 10 questions');

const blank = createBlankAnswers();
check(validateAnswers(blank).length === 0, 'a blank draft is valid while in progress');
check(validateAnswers(blank, true).length === 3, 'only Q1, Q2, and Q4 are required to complete');
check(!hasAnyAnswer(blank), 'a blank quiz is not considered a started draft');
check(
  isOptionSelected(QUIZ_QUESTIONS[0].groups[0], ['minimalist'], 'minimalist'),
  'multi-select options reflect their selected state',
);
check(
  isOptionSelected(QUIZ_QUESTIONS[8].groups[0], 'balanced', 'balanced'),
  'single-select options reflect their selected state',
);
check(
  !isOptionSelected(QUIZ_QUESTIONS[8].groups[0], 'balanced', 'classic'),
  'unselected single-select options remain unselected',
);

const complete = makeCompleteAnswers();
check(validateAnswers(complete, true).length === 0, 'valid required answers complete the profile');
check(hasAnyAnswer(complete), 'answered quiz is recognized as a draft');

const styleQuestion = QUIZ_QUESTIONS[0];
const styleGroup = styleQuestion.groups[0];
const selectedTwice = toggleMultipleChoice(
  updateGroupAnswer(complete, 'q1', 'styles', ['minimalist']),
  styleQuestion,
  styleGroup,
  'classic',
);
check(selectedTwice.q1.styles.length === 2, 'Q1 permits two style selections');
const overSelected = toggleMultipleChoice(selectedTwice, styleQuestion, styleGroup, 'streetwear');
check(overSelected === selectedTwice, 'Q1 prevents selection beyond its maximum');

const fitQuestion = QUIZ_QUESTIONS[1];
const fitGroup = fitQuestion.groups[0];
const selectedFits = toggleMultipleChoice(complete, fitQuestion, fitGroup, 'oversized');
check(selectedFits.q2.fits.length === 2, 'Q2 permits up to two fit selections');

check(
  validateAnswers(updateGroupAnswer(complete, 'q4', 'priorities', ['comfort', 'style']), true)
    .some((error) => error.includes('exactly three')),
  'Q4 requires exactly three ranked priorities',
);
check(
  validateAnswers(updateGroupAnswer(complete, 'q4', 'priorities', ['comfort', 'style', 'style']), true)
    .some((error) => error.includes('duplicate')),
  'Q4 rejects duplicate priorities',
);
check(
  validateAnswers(updateGroupAnswer(complete, 'q4', 'priorities', ['comfort', 'style', 'unknown']), true)
    .some((error) => error.includes('unknown')),
  'Q4 rejects unknown priority IDs',
);

const reordered = movePriority(complete, 2, 0);
check(
  reordered.q4.priorities.join(',') === 'weather,comfort,style',
  'ranked priority order is updated without sorting',
);
check(
  movePriority(complete, -1, 0) === complete,
  'priority movement outside the selected range is ignored',
);

const profile = {
  schemaVersion: QUIZ_SCHEMA_VERSION,
  answers: complete,
  updatedAt: '2026-10-21T00:00:00.000Z',
};
check(validateProfile(profile), 'a complete, versioned profile is valid');
check(
  JSON.parse(JSON.stringify(profile)).answers.q4.priorities.join(',') === 'comfort,style,weather',
  'ranked priority order survives JSON persistence',
);
check(!validateProfile({ ...profile, answers: blank }), 'an incomplete profile is rejected');
check(
  validateDraft({
    schemaVersion: QUIZ_SCHEMA_VERSION,
    answers: blank,
    currentQuestion: 0,
    updatedAt: '2026-10-21T00:00:00.000Z',
  }),
  'an in-progress draft may have unanswered required questions',
);
check(
  !validateDraft({
    schemaVersion: QUIZ_SCHEMA_VERSION,
    answers: blank,
    currentQuestion: 11,
    updatedAt: '2026-10-21T00:00:00.000Z',
  }),
  'draft resume position must stay within the quiz and review screens',
);

console.log(`Passed ${checks} quiz validation and ordering checks.`);
