/**
 * recommendationService.js
 * -------------------------------------------------------------------------
 * Modular, rule-based recommendation engine. Deliberately kept as pure
 * functions with a clear mood -> recommendation mapping table so this can
 * be swapped later for a learned model (e.g. collaborative filtering or a
 * contextual bandit) without touching controllers.
 * -------------------------------------------------------------------------
 */

// Core mapping table: mood -> base recommendation bundle
const MOOD_MAP = {
  happy: {
    musicCategory: 'happy',
    quoteCategory: 'positivity',
    game: 'quick_quiz',
    activity: 'Celebrate this feeling — jot down one thing that made today good.',
  },
  sad: {
    musicCategory: 'happy',
    quoteCategory: 'positivity',
    game: 'memory_match',
    activity: '5-minute breathing exercise, then a short walk if you can.',
  },
  angry: {
    musicCategory: 'relax',
    quoteCategory: 'stress relief',
    game: 'reaction_challenge',
    activity: 'Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s — repeat 5 times.',
  },
  stressed: {
    musicCategory: 'relax',
    quoteCategory: 'stress relief',
    game: 'word_scramble',
    activity: 'Break your task list into 3 small next-steps and do just the first one.',
  },
  anxious: {
    musicCategory: 'chill',
    quoteCategory: 'self-belief',
    game: 'memory_match',
    activity: 'Ground yourself: name 5 things you can see, 4 you can touch, 3 you can hear.',
  },
  bored: {
    musicCategory: 'energy',
    quoteCategory: 'motivation',
    game: 'reaction_challenge',
    activity: 'Set a 10-minute timer and try a small creative challenge.',
  },
  tired: {
    musicCategory: 'sleep',
    quoteCategory: 'self-belief',
    game: 'word_scramble',
    activity: 'Consider a short rest, hydrate, and lower screen brightness for a while.',
  },
  calm: {
    musicCategory: 'focus',
    quoteCategory: 'productivity',
    game: 'quick_quiz',
    activity: 'Great state for focused work — try a 25-minute focus sprint.',
  },
  excited: {
    musicCategory: 'energy',
    quoteCategory: 'success',
    game: 'reaction_challenge',
    activity: 'Channel the energy into your top goal for today.',
  },
  neutral: {
    musicCategory: 'chill',
    quoteCategory: 'motivation',
    game: 'quick_quiz',
    activity: 'Take a moment to check in with yourself — how do you want the rest of today to feel?',
  },
};

// Intensity nudges: at high intensity we lean further toward soothing options
const INTENSITY_OVERRIDES = {
  high: {
    sad: { musicCategory: 'relax' },
    angry: { game: 'reaction_challenge', musicCategory: 'relax' },
    stressed: { musicCategory: 'sleep' },
    anxious: { musicCategory: 'sleep' },
  },
};

/**
 * Build a personalized recommendation bundle.
 * @param {Object} params
 * @param {string} params.mood
 * @param {string} params.intensity
 * @param {string[]} [params.recentMoods] - last N emotions, most recent first
 * @param {string[]} [params.previousActivities] - recently completed activity/game types, to add variety
 * @param {string} [params.personality] - selected counsellor personality, lightly flavors the activity text
 */
function getRecommendations({ mood, intensity = 'medium', recentMoods = [], previousActivities = [], personality } = {}) {
  const base = MOOD_MAP[mood] || MOOD_MAP.neutral;
  const override = INTENSITY_OVERRIDES[intensity]?.[mood] || {};
  let bundle = { ...base, ...override };

  // Simple variety logic: if the same game was just played, rotate to another
  // game associated with a neighboring mood so recommendations don't feel stale.
  if (previousActivities.includes(bundle.game)) {
    const alternatives = Object.values(MOOD_MAP)
      .map((m) => m.game)
      .filter((g) => g !== bundle.game);
    if (alternatives.length) {
      bundle = { ...bundle, game: alternatives[Math.floor(Math.random() * alternatives.length)] };
    }
  }

  // If mood has been persistently negative across recent history, nudge
  // toward the calmest possible bundle regardless of the single-point mood.
  const negativeMoods = ['sad', 'angry', 'stressed', 'anxious', 'tired'];
  let hasNegativeStreak = false;
  const negativeStreak = recentMoods.slice(0, 3).every((m) => negativeMoods.includes(m)) && recentMoods.length >= 2;
  if (negativeStreak) {
    hasNegativeStreak = true;
    bundle = { ...bundle, musicCategory: 'relax', activity: `${bundle.activity} You've had a tough few check-ins — be gentle with yourself today.` };
  }

  return {
    mood,
    intensity,
    negativeStreak: hasNegativeStreak,
    ...bundle,
  };
}

module.exports = { getRecommendations, MOOD_MAP };
