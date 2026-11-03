const { getRecommendations } = require('../services/recommendationService');

describe('recommendationService', () => {
  test('recommends calming content for high-intensity stress', () => {
    const bundle = getRecommendations({ mood: 'stressed', intensity: 'high' });
    expect(bundle.musicCategory).toBe('sleep');
    expect(bundle.quoteCategory).toBe('stress relief');
  });

  test('recommends energetic content for boredom', () => {
    const bundle = getRecommendations({ mood: 'bored', intensity: 'medium' });
    expect(bundle.musicCategory).toBe('energy');
    expect(bundle.game).toBe('reaction_challenge');
  });

  test('falls back to neutral bundle for unknown mood', () => {
    const bundle = getRecommendations({ mood: 'unknown_mood' });
    expect(bundle.musicCategory).toBe('chill');
  });

  test('avoids repeating the exact same game twice in a row', () => {
    const bundle = getRecommendations({ mood: 'happy', previousActivities: ['quick_quiz'] });
    expect(bundle.game).not.toBe('quick_quiz');
  });
});
