const option = (id, label, detail, visual, swatches) => ({
  id,
  label,
  detail,
  visual,
  swatches,
});

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    section: 'Fashion identity · 1 of 4',
    title: 'Which fashion styles best represent you?',
    description: 'Choose up to two. We’ll use these as inspiration, not rules.',
    groups: [{
      id: 'styles',
      selection: 'multiple',
      max: 2,
      required: true,
      options: [
        option('minimalist', 'Minimalist', 'Clean lines, considered basics.', '◻'),
        option('streetwear', 'Streetwear', 'Relaxed shapes with an edge.', '▧'),
        option('smart-casual', 'Smart Casual', 'Polished, never too formal.', '◇'),
        option('athleisure', 'Athleisure', 'Sport-inspired everyday ease.', '◉'),
        option('classic', 'Classic', 'Timeless pieces that last.', '⌑'),
        option('vintage', 'Vintage', 'Character and a little nostalgia.', '✳'),
        option('y2k', 'Y2K', 'Playful references to the early 2000s.', '✦'),
        option('preppy', 'Preppy', 'Crisp, collegiate, and composed.', '▤'),
      ],
    }],
  },
  {
    id: 'q2',
    section: 'Fashion identity · 2 of 4',
    title: 'How do you prefer your clothes to fit?',
    description: 'Choose up to two silhouettes that feel like you.',
    groups: [{
      id: 'fits',
      selection: 'multiple',
      max: 2,
      required: true,
      options: [
        option('slim', 'Slim / Fitted', 'Close to the body.', '│'),
        option('regular', 'Regular', 'An easy, balanced shape.', '║'),
        option('relaxed', 'Relaxed', 'Room to move and breathe.', '▥'),
        option('oversized', 'Oversized', 'An intentionally generous shape.', '▦'),
      ],
    }],
  },
  {
    id: 'q3',
    section: 'Fashion identity · 3 of 4',
    title: 'Which color families do you gravitate toward?',
    description: 'Choose up to two palettes. Your choices guide, but never limit, outfit ideas.',
    groups: [{
      id: 'colors',
      selection: 'multiple',
      max: 2,
      options: [
        option('neutrals', 'Neutrals', 'Cream, taupe, and soft gray.', '●', ['#F6F1E9', '#B7AA98', '#858987']),
        option('earth-tones', 'Earth Tones', 'Warm, grounded shades.', '●', ['#94734F', '#7B694D', '#66765A']),
        option('pastels', 'Pastels', 'Soft, light color.', '●', ['#E9C8CC', '#B8C8D7', '#D8D0E8']),
        option('brights', 'Brights', 'Clear, energetic color.', '●', ['#E6524A', '#EAB548', '#4276B8']),
        option('darks', 'Darks', 'Deep, rich shades.', '●', ['#242927', '#343A40', '#563F51']),
        option('monochrome', 'Monochrome', 'A focused, tonal palette.', '●', ['#F4F4EF', '#8D928D', '#262A28']),
      ],
    }],
  },
  {
    id: 'q4',
    section: 'Fashion identity · 4 of 4',
    title: 'What matters most when choosing an outfit?',
    description: 'Rank exactly three. Your first choice matters most; move them with the arrow buttons.',
    groups: [{
      id: 'priorities',
      selection: 'ranked',
      max: 3,
      required: true,
      options: [
        option('comfort', 'Comfort', 'Feeling at ease all day.', '01'),
        option('style', 'Looking Stylish', 'Feeling polished and put together.', '02'),
        option('weather', 'Weather Appropriateness', 'Being ready for the conditions.', '03'),
        option('convenience', 'Convenience', 'Getting dressed without fuss.', '04'),
        option('personality', 'Expressing Personality', 'Showing what makes your style yours.', '05'),
        option('versatility', 'Versatility', 'Making pieces work in more ways.', '06'),
      ],
    }],
  },
  {
    id: 'q5',
    section: 'Weather & comfort · 1 of 3',
    title: 'At 45°F / 7°C, what would you reach for?',
    description: 'Select up to two outfit ideas, then tell us how cold you tend to feel.',
    groups: [
      {
        id: 'coldOutfits',
        label: 'Cold-weather outfit ideas · up to 2',
        selection: 'multiple',
        max: 2,
        options: [
          option('light-layers', 'Light Layers', 'A light knit or overshirt.', '☼'),
          option('warm-layers', 'Warm Layers', 'A cozy knit with another layer.', '▤'),
          option('coat-and-boots', 'Coat & Boots', 'More coverage from head to toe.', '♧'),
          option('shorts-light-top', 'Shorts & a Light Top', 'Less coverage, even in the cold.', '⌁'),
        ],
      },
      {
        id: 'coldSensitivity',
        label: 'How cold do you usually feel?',
        selection: 'single',
        options: [
          option('not-cold', 'Not Cold', 'Cool weather rarely bothers me.', '01'),
          option('a-little-cold', 'A Little Cold', 'I like a comfortable extra layer.', '02'),
          option('very-cold', 'Very Cold', 'Warmth is usually a priority.', '03'),
        ],
      },
    ],
  },
  {
    id: 'q6',
    section: 'Weather & comfort · 2 of 3',
    title: 'At 90°F / 32°C, what feels right?',
    description: 'Choose up to two outfit ideas and share your heat and coverage preferences.',
    groups: [
      {
        id: 'hotOutfits',
        label: 'Hot-weather outfit ideas · up to 2',
        selection: 'multiple',
        max: 2,
        options: [
          option('light-and-breezy', 'Light & Breezy', 'Airy pieces with room to move.', '☼'),
          option('shorts-and-tee', 'Shorts & Tee', 'An easy warm-weather uniform.', '⌁'),
          option('light-coverage', 'Light Coverage', 'A little more coverage in light fabrics.', '▤'),
          option('more-coverage', 'More Coverage', 'Keep covered, even in the heat.', '▥'),
        ],
      },
      {
        id: 'heatTolerance',
        label: 'How does heat feel to you?',
        selection: 'single',
        options: [
          option('comfortable', 'Comfortable', 'Warm weather feels manageable.', '01'),
          option('warm', 'Warm', 'I notice the heat.', '02'),
          option('extremely-hot', 'Extremely Hot', 'I get uncomfortable in the heat quickly.', '03'),
        ],
      },
      {
        id: 'coverage',
        label: 'Preferred coverage',
        selection: 'single',
        options: [
          option('minimal', 'Minimal', 'Less coverage feels best.', '01'),
          option('moderate', 'Moderate', 'A balance of coverage and airflow.', '02'),
          option('more', 'More', 'I prefer to stay more covered.', '03'),
        ],
      },
    ],
  },
  {
    id: 'q7',
    section: 'Weather & comfort · 3 of 3',
    title: 'What’s your approach to a rainy 65°F / 18°C day?',
    description: 'Choose up to two outfit ideas, then tell us what protection and footwear you prefer.',
    groups: [
      {
        id: 'rainOutfits',
        label: 'Rainy-day outfit ideas · up to 2',
        selection: 'multiple',
        max: 2,
        options: [
          option('waterproof-layers', 'Waterproof Layers', 'Add a layer made for rain.', '☂'),
          option('umbrella-and-everyday', 'Umbrella & Everyday Clothes', 'Keep the outfit familiar.', '⌁'),
          option('minimal-extra', 'Minimal Extra Protection', 'Keep it simple and light.', '☼'),
        ],
      },
      {
        id: 'rainProtection',
        label: 'Protection preference',
        selection: 'single',
        options: [
          option('waterproof-layers', 'Waterproof Layers', 'A protective outer layer.', '☂'),
          option('umbrella', 'Umbrella', 'An umbrella is enough for me.', '◒'),
          option('minimal', 'Minimal Extra Protection', 'I prefer no added protection.', '☼'),
        ],
      },
      {
        id: 'rainFootwear',
        label: 'Footwear preference',
        selection: 'single',
        options: [
          option('waterproof-shoes', 'Waterproof Shoes or Boots', 'Footwear intended for wet weather.', '▰'),
          option('sneakers', 'Everyday Sneakers', 'My usual sneakers are fine.', '▱'),
          option('open-shoes', 'Sandals or Open Shoes', 'I prefer open footwear.', '⌁'),
        ],
      },
    ],
  },
  {
    id: 'q8',
    section: 'Lifestyle & goals · 1 of 3',
    title: 'How formal do you like to dress day to day?',
    description: 'Choose up to two. Your selected occasion will always come first.',
    groups: [{
      id: 'formality',
      selection: 'multiple',
      max: 2,
      options: [
        option('very-casual', 'Very Casual', 'Relaxed and laid back.', '⌁'),
        option('casual', 'Casual', 'Easy everyday clothes.', '◻'),
        option('smart-casual', 'Smart Casual', 'A polished everyday balance.', '◇'),
        option('business-casual', 'Business Casual', 'Work-ready, without a suit.', '▤'),
        option('formal', 'Formal', 'A more elevated finish.', '▧'),
      ],
    }],
  },
  {
    id: 'q9',
    section: 'Lifestyle & goals · 2 of 3',
    title: 'How adventurous should your outfit ideas be?',
    description: 'This helps set how familiar or unexpected your combinations feel.',
    groups: [{
      id: 'adventurousness',
      selection: 'single',
      options: [
        option('classic', 'Classic', 'Stay close to combinations I know.', '01'),
        option('balanced', 'Balanced', 'Mix familiar pieces with a new idea.', '02'),
        option('adventurous', 'Adventurous', 'Show me more unexpected pairings.', '03'),
      ],
    }],
  },
  {
    id: 'q10',
    section: 'Lifestyle & goals · 3 of 3',
    title: 'What would you like a little help with?',
    description: 'Choose up to two challenges and one main goal.',
    groups: [
      {
        id: 'challenges',
        label: 'Outfit challenges · up to 2',
        selection: 'multiple',
        max: 2,
        options: [
          option('matching', 'Matching Clothes', 'Putting pieces together.', '◇'),
          option('weather', 'Dressing for Weather', 'Knowing what works for the day.', '☼'),
          option('occasions', 'Dressing for Occasions', 'Finding the right level of dress.', '▤'),
          option('deciding-quickly', 'Deciding What to Wear Quickly', 'Getting out the door with less fuss.', '◷'),
          option('maximizing-wardrobe', 'Maximizing My Wardrobe', 'Making more of what I own.', '▦'),
          option('trying-new-styles', 'Trying New Styles', 'Exploring fresh combinations.', '✦'),
        ],
      },
      {
        id: 'primaryGoal',
        label: 'Your primary goal',
        selection: 'single',
        options: [
          option('save-time', 'Save Time', 'Make getting dressed simpler.', '01'),
          option('feel-confident', 'Feel Confident', 'Feel good in what I wear.', '02'),
          option('discover-combinations', 'Discover New Combinations', 'See my wardrobe differently.', '03'),
          option('dress-for-occasions', 'Dress for Occasions', 'Feel ready for each plan.', '04'),
          option('maximize-use', 'Maximize Wardrobe Use', 'Get more from my existing clothes.', '05'),
        ],
      },
    ],
  },
];

const QUIZ_SCHEMA_VERSION = 1;

function createBlankAnswers() {
  return Object.fromEntries(
    QUIZ_QUESTIONS.map((question) => [
      question.id,
      Object.fromEntries(question.groups.map((group) => [
        group.id,
        group.selection === 'single' ? null : [],
      ])),
    ]),
  );
}

function validateAnswers(answers, requireComplete = false) {
  const errors = [];
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return ['Quiz answers are missing or invalid.'];
  }

  for (const question of QUIZ_QUESTIONS) {
    const questionAnswers = answers[question.id];
    for (const group of question.groups) {
      const value = questionAnswers?.[group.id];
      if (group.selection === 'single') {
        if (
          value !== null &&
          value !== undefined &&
          !group.options.some((item) => item.id === value)
        ) {
          errors.push(`${group.label || group.id} contains an unknown choice.`);
        } else if (requireComplete && group.required && !value) {
          errors.push(`Please answer “${question.title}”.`);
        }
        continue;
      }

      if (!Array.isArray(value)) {
        errors.push(`${group.label || group.id} must be a list of choices.`);
        continue;
      }

      if (new Set(value).size !== value.length) {
        errors.push(`${group.label || group.id} cannot contain duplicate choices.`);
      }
      if (value.length > group.max) {
        errors.push(`${group.label || group.id} allows at most ${group.max} choices.`);
      }
      if (value.some((id) => !group.options.some((item) => item.id === id))) {
        errors.push(`${group.label || group.id} contains an unknown choice.`);
      }
      if (
        requireComplete &&
        group.required &&
        (group.selection === 'ranked' ? value.length !== group.max : value.length === 0)
      ) {
        errors.push(group.selection === 'ranked'
          ? 'Rank exactly three distinct outfit priorities.'
          : `Please answer “${question.title}”.`);
      }
    }
  }

  return errors;
}

function updateGroupAnswer(answers, questionId, groupId, nextValue) {
  return {
    ...answers,
    [questionId]: {
      ...answers[questionId],
      [groupId]: nextValue,
    },
  };
}

function isOptionSelected(group, answer, optionId) {
  if (group.selection === 'single') return answer === optionId;
  return Array.isArray(answer) && answer.includes(optionId);
}

function toggleMultipleChoice(answers, question, group, optionId) {
  const selected = answers[question.id][group.id];
  if (selected.includes(optionId)) {
    return updateGroupAnswer(
      answers,
      question.id,
      group.id,
      selected.filter((id) => id !== optionId),
    );
  }
  if (selected.length >= group.max) return answers;
  return updateGroupAnswer(answers, question.id, group.id, [...selected, optionId]);
}

function movePriority(answers, fromIndex, toIndex) {
  const ranked = answers.q4.priorities;
  if (
    !Array.isArray(ranked) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= ranked.length ||
    toIndex >= ranked.length
  ) {
    return answers;
  }
  const nextRanked = [...ranked];
  const [moved] = nextRanked.splice(fromIndex, 1);
  nextRanked.splice(toIndex, 0, moved);
  return updateGroupAnswer(answers, 'q4', 'priorities', nextRanked);
}

function hasAnyAnswer(answers) {
  return QUIZ_QUESTIONS.some((question) =>
    question.groups.some((group) => {
      const value = answers?.[question.id]?.[group.id];
      return Array.isArray(value) ? value.length > 0 : value != null;
    }),
  );
}

function validateDraft(draft) {
  if (
    !draft ||
    typeof draft !== 'object' ||
    draft.schemaVersion !== QUIZ_SCHEMA_VERSION ||
    typeof draft.updatedAt !== 'string' ||
    !Number.isInteger(draft.currentQuestion) ||
    draft.currentQuestion < 0 ||
    draft.currentQuestion > QUIZ_QUESTIONS.length
  ) {
    return false;
  }
  return validateAnswers(draft.answers).length === 0;
}

function validateProfile(profile) {
  return Boolean(
    profile &&
    typeof profile === 'object' &&
    profile.schemaVersion === QUIZ_SCHEMA_VERSION &&
    typeof profile.updatedAt === 'string' &&
    validateAnswers(profile.answers, true).length === 0,
  );
}

module.exports = {
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
};
