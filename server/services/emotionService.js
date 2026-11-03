/**
 * emotionService.js
 * -------------------------------------------------------------------------
 * Practical, locally-running NLP emotion classification pipeline.
 *
 * Approach: lexicon + rule-based scoring with lightweight stemming, so
 * common variants of a word ("stress", "stressed", "stressing") all match
 * the same lexicon entry instead of requiring an exact match. Every
 * word/phrase in the input is matched against weighted emotion lexicons;
 * intensifiers, negations and punctuation (e.g. "!!!") adjust the score.
 *
 * This module is intentionally decoupled behind `classifyEmotion(text)` so
 * it can be swapped later for a real deep-learning model (e.g. a
 * fine-tuned transformer) or a hosted LLM without changing any caller.
 * If AI_API_KEY is set in the environment, classification is delegated to
 * the configured LLM instead (see `classifyWithLLM`), with this local
 * engine kept as an automatic fallback if that call fails.
 *
 * Output contract (always this shape):
 * {
 *   emotion: 'stressed',
 *   confidence: 0.87,
 *   intensity: 'high',
 *   interpretation: 'Your response suggests that you may be feeling stressed.'
 * }
 * -------------------------------------------------------------------------
 */

const fetch = require('node-fetch');
const { EMOTIONS } = require('../config/constants');

// Weighted lexicon: word/phrase -> weight, grouped by emotion. Single words
// are matched by *stem* (see `stem()` below) so "stress"/"stressed"/
// "stressing" all hit the same entry. Multi-word phrases are matched as
// substrings against the full normalized text.
const LEXICON = {
  happy: {
    happy: 1, happiness: 1, joy: 1, joyful: 1, glad: 0.8, great: 0.6, awesome: 0.9,
    wonderful: 0.9, delighted: 1, cheerful: 0.9, pleased: 0.7, fantastic: 0.9,
    smile: 0.7, smiling: 0.7, grateful: 0.6, thankful: 0.6, love: 0.7, loved: 0.7,
    blessed: 0.6, content: 0.5, proud: 0.7, amazing: 0.8, upbeat: 0.8,
    yay: 0.7, woohoo: 0.8, celebrate: 0.7, celebrating: 0.7, success: 0.6, win: 0.6,
    won: 0.6, 'good day': 0.6, 'feeling good': 0.8, 'so happy': 1.2, 'great day': 0.8,
    'went well': 0.6, 'really enjoyed': 0.7,
  },
  sad: {
    sad: 1, sadness: 1, unhappy: 0.9, down: 0.6, depressed: 1, lonely: 0.9, alone: 0.6,
    heartbroken: 1, cry: 0.9, crying: 0.9, cried: 0.9, upset: 0.7, hopeless: 1,
    miserable: 1, hurt: 0.6, disappointed: 0.7, disappointing: 0.6, empty: 0.6,
    grief: 0.9, loss: 0.6, lost: 0.5, sorrow: 0.9, gloomy: 0.7, low: 0.5, blue: 0.5,
    heartache: 0.9, hopelessness: 1, 'feel down': 0.9, 'not okay': 0.7,
    'broke up': 0.9, 'miss him': 0.6, 'miss her': 0.6, 'miss them': 0.6,
    'feel like crying': 1.1, 'want to cry': 1.1, 'nothing feels fun': 0.8,
  },
  angry: {
    angry: 1, anger: 1, mad: 0.9, furious: 1, annoyed: 0.7, annoying: 0.6, irritated: 0.7,
    irritating: 0.6, frustrated: 0.8, frustrating: 0.7, rage: 1, hate: 0.8, hated: 0.8,
    pissed: 0.9, resentful: 0.8, outraged: 1, hostile: 0.8, unfair: 0.6, betrayed: 0.7,
    'so annoyed': 1, 'so angry': 1.2, 'fed up': 0.9, 'sick of': 0.8, 'can\'t stand': 0.9,
    'makes me angry': 1, 'makes me mad': 1, 'lost my temper': 0.9,
  },
  stressed: {
    stress: 1, stressed: 1, stressful: 1, stressing: 1, overwhelmed: 1, overwhelming: 1,
    pressure: 0.7, pressured: 0.8, deadline: 0.7, deadlines: 0.7, workload: 0.7,
    exhausted: 0.6, burnout: 1, swamped: 0.8, chaotic: 0.6, hectic: 0.7, busy: 0.4,
    assignment: 0.5, assignments: 0.5, exam: 0.5, exams: 0.5, homework: 0.5,
    coursework: 0.6, 'too much work': 1, 'too much college work': 1.1,
    'so much work': 1, 'lot of work': 0.9, 'a lot to do': 0.8, 'can\'t cope': 1.1,
    'can\'t keep up': 1, 'falling behind': 0.9, 'behind schedule': 0.8,
    'burned out': 1, 'burnt out': 1, 'so many deadlines': 1.1, 'no time': 0.7,
    'running out of time': 0.9, 'exam tomorrow': 0.9, 'test tomorrow': 0.9,
    'piling up': 0.9, 'so busy': 0.8,
  },
  anxious: {
    anxious: 1, anxiety: 1, nervous: 0.8, worried: 0.9, worry: 0.8, worrying: 0.8,
    panic: 1, panicking: 1, scared: 0.7, afraid: 0.7, fear: 0.7, fearful: 0.7,
    uneasy: 0.6, dread: 0.9, dreading: 0.9, overthinking: 0.8, tense: 0.6,
    nervousness: 0.8, apprehensive: 0.7, 'on edge': 0.9, 'freaking out': 1,
    'can\'t stop thinking': 0.9, 'mind is racing': 1,
    'heart racing': 0.8, 'racing thoughts': 0.9, 'butterflies in my stomach': 0.7,
    'scared about': 0.8, 'nervous about': 0.8, 'worried about': 0.9,
  },
  bored: {
    bored: 1, boredom: 1, boring: 0.9, dull: 0.7, uninterested: 0.7, monotonous: 0.7,
    meh: 0.5, restless: 0.5, uninspired: 0.6, stagnant: 0.5, 'nothing to do': 1,
    'so bored': 1.2, 'bored out of my mind': 1.3, 'nothing interesting': 0.8,
    'same routine': 0.7, 'kind of dull': 0.7,
  },
  tired: {
    tired: 1, tiredness: 1, exhausted: 0.9, exhaustion: 0.9, sleepy: 0.8, fatigued: 0.9,
    fatigue: 0.9, drained: 0.9, weary: 0.8, sluggish: 0.7, groggy: 0.7, drowsy: 0.7,
    'no energy': 1, 'low energy': 0.9, 'can\'t sleep': 0.6, insomnia: 0.6,
    'so tired': 1.2, 'exhausted all the time': 1.1, 'barely slept': 0.9,
    'didn\'t sleep': 0.8, 'need a nap': 0.7, 'need rest': 0.7, 'want to sleep': 0.6,
  },
  calm: {
    calm: 1, calmness: 1, relaxed: 1, relaxing: 0.8, peaceful: 0.9, chill: 0.7,
    serene: 0.9, tranquil: 0.9, balanced: 0.6, mellow: 0.6, steady: 0.5, settled: 0.6,
    'at ease': 0.9, 'at peace': 0.9, 'feeling okay': 0.5, 'pretty good': 0.5,
    'feeling fine': 0.5, 'nice and quiet': 0.6, 'took a breath': 0.5,
  },
  excited: {
    excited: 1, excitement: 1, thrilled: 1, pumped: 0.9, eager: 0.7, enthusiastic: 0.9,
    hyped: 0.8, stoked: 0.8, energized: 0.7, energised: 0.7, ecstatic: 1,
    'can\'t wait': 1, 'so excited': 1.2, 'looking forward': 0.8, 'super pumped': 1,
    'really excited': 1.1,
  },
  neutral: {
    okay: 0.3, fine: 0.3, normal: 0.4, nothing: 0.2, alright: 0.3, ordinary: 0.3,
    average: 0.3, 'nothing much': 0.4, 'just okay': 0.4, 'so so': 0.3,
  },
};

// Precompute: stem-of-single-word -> { emotion: weight } for O(1) lookup,
// and a list of multi-word phrases per emotion for substring matching.
const STEM_LOOKUP = {};
const PHRASES = {};

function stem(word) {
  // A deliberately small, safe suffix stripper (not a full Porter stemmer) —
  // good enough to unify common tense/plural variants without over-merging
  // unrelated short words.
  if (word.length > 6 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 5 && word.endsWith('edly')) return word.slice(0, -4);
  if (word.length > 5 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 5 && word.endsWith('ness')) return word.slice(0, -4);
  if (word.length > 5 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

for (const [emotion, entries] of Object.entries(LEXICON)) {
  PHRASES[emotion] = [];
  for (const [key, weight] of Object.entries(entries)) {
    if (key.includes(' ')) {
      PHRASES[emotion].push([key, weight]);
      continue;
    }
    const s = stem(key);
    if (!STEM_LOOKUP[s]) STEM_LOOKUP[s] = {};
    // Keep the strongest weight if the same stem appears for an emotion twice
    STEM_LOOKUP[s][emotion] = Math.max(STEM_LOOKUP[s][emotion] || 0, weight);
  }
}

const INTENSIFIERS = ['very', 'extremely', 'really', 'so', 'too', 'incredibly', 'super', 'totally', 'completely', 'absolutely'];
const NEGATIONS = ['not', "don't", 'do not', "doesn't", 'never', 'no longer', "isn't", "wasn't", "can't", 'cannot', "won't"];

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyLocally(rawText) {
  const text = normalize(rawText);
  const words = text.split(' ').filter(Boolean);
  const scores = Object.fromEntries(EMOTIONS.map((e) => [e, 0]));

  // --- Phrase matching (substring, across the whole normalized text) ---
  for (const emotion of Object.keys(PHRASES)) {
    for (const [phrase, weight] of PHRASES[emotion]) {
      if (text.includes(phrase)) {
        scores[emotion] += weight * 1.3;
      }
    }
  }

  // --- Single-word matching via stem lookup (handles plurals/tenses) ---
  words.forEach((word, idx) => {
    const s = stem(word);
    const matches = STEM_LOOKUP[s];
    if (!matches) return;

    const prev = words[idx - 1];
    const prevPrev = idx > 1 ? `${words[idx - 2]} ${words[idx - 1]}` : null;
    const isIntensified = prev && INTENSIFIERS.includes(prev);
    const isNegated = (prev && NEGATIONS.includes(prev)) || (prevPrev && NEGATIONS.includes(prevPrev));

    for (const [emotion, weight] of Object.entries(matches)) {
      let w = weight;
      if (isIntensified) w *= 1.4;
      if (isNegated) w *= -0.8; // negation flips/softens the signal
      scores[emotion] += w;
    }
  });

  // Exclamation marks nudge intensity toward more energetic/activated states
  const exclaims = (rawText.match(/!/g) || []).length;
  if (exclaims > 0) {
    scores.excited += exclaims * 0.2;
    scores.angry += exclaims * 0.1;
  }

  // Pick the highest-scoring emotion; default to neutral only if truly nothing matched
  let best = 'neutral';
  let bestScore = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = emotion;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    return {
      emotion: 'neutral',
      confidence: 0.55,
      intensity: 'low',
      interpretation: buildInterpretation('neutral', 'low'),
    };
  }

  // Normalize confidence into a believable 0.55-0.98 band using a soft cap
  const confidence = Math.min(0.98, 0.55 + bestScore / (bestScore + 2.5));

  let intensity = 'low';
  if (bestScore >= 2.0) intensity = 'high';
  else if (bestScore >= 0.9) intensity = 'medium';

  return {
    emotion: best,
    confidence: Number(confidence.toFixed(2)),
    intensity,
    interpretation: buildInterpretation(best, intensity),
  };
}

function buildInterpretation(emotion, intensity) {
  const phrasing = {
    happy: 'Your response suggests that you may be feeling happy and upbeat',
    sad: 'Your response suggests that you may be feeling sad or down',
    angry: 'Your response suggests that you may be feeling angry or frustrated',
    stressed: 'Your response suggests that you may be feeling stressed',
    anxious: 'Your response suggests that you may be feeling anxious or worried',
    bored: 'Your response suggests that you may be feeling bored or understimulated',
    tired: 'Your response suggests that you may be feeling tired or low on energy',
    calm: 'Your response suggests that you may be feeling calm and settled',
    excited: 'Your response suggests that you may be feeling excited and energized',
    neutral: 'Your response does not show a strong emotional signal',
  };
  const intensityPhrase = intensity === 'high' ? ', and fairly strongly so.' : intensity === 'medium' ? ' at a moderate level.' : ' at a mild level.';
  return `${phrasing[emotion] || phrasing.neutral}${intensityPhrase} This is an informational reflection, not a medical or clinical diagnosis.`;
}

// Optional: delegate to a configured LLM for higher-quality classification.
async function classifyWithLLM(text) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_CLASSIFIER_MODEL || process.env.AI_MODEL || 'gpt-4o-mini';

  const prompt = `Classify the emotion in the following first-person message into exactly one of these categories: ${EMOTIONS.join(', ')}.
The message may be written in ANY language or script (including romanized text such as Hinglish). Understand it in its own language. Write the "interpretation" sentence in the SAME language and script as the message. The "emotion" value must always be one of the English category names above.
Respond ONLY with strict JSON, no extra commentary, no markdown fences: {"emotion": "...", "confidence": 0.0-1.0, "intensity": "low|medium|high", "interpretation": "one short supportive sentence, non-clinical, non-diagnostic"}.
Message: """${text}"""`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 250,
      }),
    });
    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error(`[emotionService] LLM request failed (${response.status} ${response.statusText}). Falling back to local classifier. Response body: ${bodyText.slice(0, 500)}`);
      return null;
    }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      console.error('[emotionService] LLM returned an empty response body, falling back to local classifier:', JSON.stringify(data).slice(0, 500));
      return null;
    }

    // Models don't always follow "JSON only" perfectly — some wrap it in
    // markdown fences or add a sentence before/after. Extract the first
    // {...} block rather than assuming the whole string is clean JSON.
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[emotionService] LLM response did not contain parseable JSON, falling back to local classifier. Raw response:', raw.slice(0, 300));
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[emotionService] Failed to parse LLM JSON, falling back to local classifier:', parseErr.message, '| Raw:', jsonMatch[0].slice(0, 300));
      return null;
    }

    if (!EMOTIONS.includes(parsed.emotion)) {
      console.error(`[emotionService] LLM returned an unrecognized emotion "${parsed.emotion}", falling back to local classifier.`);
      return null;
    }

    return {
      emotion: parsed.emotion,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
      intensity: ['low', 'medium', 'high'].includes(parsed.intensity) ? parsed.intensity : 'medium',
      interpretation: parsed.interpretation || buildInterpretation(parsed.emotion, parsed.intensity || 'medium'),
    };
  } catch (err) {
    console.error('[emotionService] LLM request threw an error, falling back to local classifier:', err.message);
    return null;
  }
}

/**
 * Main entry point used by controllers.
 * Tries the configured LLM first (if AI_API_KEY set), otherwise/fallback
 * uses the local lexicon-based classifier so the feature always works.
 */
async function classifyEmotion(text) {
  if (!text || !text.trim()) {
    throw new Error('Text is required for emotion classification');
  }
  const llmResult = await classifyWithLLM(text);
  if (llmResult) return llmResult;
  return classifyLocally(text);
}

// Very lightweight crisis-language detector used by the chat service to
// trigger safety guidance. This is NOT a diagnostic tool.
const CRISIS_PATTERNS = [
  /suicid/i, /kill myself/i, /end my life/i, /want to die/i, /self.?harm/i,
  /hurt myself/i, /no reason to live/i, /can'?t go on/i,
  // Safety-net keywords in other languages (the LLM also checks every language itself)
  /आत्महत्या/, /मरना चाहता/, /मरना चाहती/, /जान दे/, /खुदकुशी/,
  /ఆత్మహత్య/, /చనిపోవాలి/, /చచ్చిపోవాలి/,
  /தற்கொலை/, /சாக வேண்டும்/, /சாகணும்/,
  /আত্মহত্যা/, /মরে যেতে চাই/, /মরতে চাই/,
  /انتحار/, /أريد أن أموت/, /اقتل نفسي/,
  /suicidio/i, /quiero morir/i, /quitarme la vida/i, /matarme/i,
  /suicide/i, /veux mourir/i, /me tuer/i, /en finir/i,
  /mujhe marna hai/i, /marna chahta/i, /marna chahti/i, /jaan de dun/i, /suicide karna/i,
];

function detectCrisisLanguage(text) {
  if (!text) return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

module.exports = { classifyEmotion, classifyLocally, detectCrisisLanguage };
