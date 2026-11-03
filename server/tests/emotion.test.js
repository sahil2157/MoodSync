const { classifyLocally, detectCrisisLanguage } = require('../services/emotionService');

describe('emotionService - local NLP classifier', () => {
  test('detects stress from a typical stressed message', () => {
    const result = classifyLocally('I feel so stressed because I have too much college work');
    expect(result.emotion).toBe('stressed');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(['low', 'medium', 'high']).toContain(result.intensity);
    expect(result.interpretation).toMatch(/not a medical or clinical diagnosis/i);
  });

  test('detects happiness', () => {
    const result = classifyLocally('I am so happy and grateful today, everything feels wonderful!');
    expect(result.emotion).toBe('happy');
  });

  test('detects sadness', () => {
    const result = classifyLocally('I feel really sad and lonely, I have been crying all day');
    expect(result.emotion).toBe('sad');
  });

  test('falls back to neutral when no signal is present', () => {
    const result = classifyLocally('The meeting is at 3pm in room 204');
    expect(result.emotion).toBe('neutral');
  });

  test('flags crisis language', () => {
    expect(detectCrisisLanguage('I want to kill myself')).toBe(true);
    expect(detectCrisisLanguage('I had a great day at work')).toBe(false);
  });

  // Regression coverage: everyday phrasing (plurals, contractions, tenses)
  // must not collapse to "neutral" just because it doesn't exactly match a
  // lexicon entry. See recommendationService — a "neutral" mood always maps
  // to the same generic bundle, so under-detection here was the root cause
  // of "same games/music every time" reports.
  test('detects stress from everyday phrasing with plurals/contractions', () => {
    const result = classifyLocally("I have so much work and can't keep up with all my assignments");
    expect(result.emotion).toBe('stressed');
  });

  test('detects boredom from natural phrasing', () => {
    const result = classifyLocally('nothing to do today, so bored out of my mind');
    expect(result.emotion).toBe('bored');
  });

  test('detects tiredness from natural phrasing', () => {
    const result = classifyLocally('I am exhausted, barely slept last night, no energy at all');
    expect(result.emotion).toBe('tired');
  });

  test('detects excitement from natural phrasing', () => {
    const result = classifyLocally("I can't wait for the trip this weekend, so excited");
    expect(result.emotion).toBe('excited');
  });

  test('genuinely neutral logistics text stays neutral', () => {
    const result = classifyLocally('The meeting is at 3pm in room 204');
    expect(result.emotion).toBe('neutral');
  });
});
