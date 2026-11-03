const { generateReply } = require('../services/chatService');

describe('chatService - local responder (no AI_API_KEY configured)', () => {
  // Regression coverage: the local fallback reply used to completely ignore
  // the message content and rely on a stale mood, producing an identical
  // reply for every message in a session. This locks in the fix.
  test('produces a different reply for two different messages with the same personality/mood', async () => {
    const { reply: replyA } = await generateReply({
      personality: 'warm_empathetic',
      message: 'I have an exam tomorrow and I am so stressed about it',
      mood: 'stressed',
    });
    const { reply: replyB } = await generateReply({
      personality: 'warm_empathetic',
      message: 'I am so stressed about my deadline again',
      mood: 'stressed',
    });
    expect(replyA).not.toBe(replyB);
  });

  test('reply text reflects the mood passed in, not a generic response', async () => {
    const { reply } = await generateReply({
      personality: 'warm_empathetic',
      message: 'nothing to do, so bored out of my mind',
      mood: 'bored',
    });
    expect(reply.toLowerCase()).toMatch(/flat|understimulating|creative challenge|re-energize/);
  });

  test('crisis language always returns the fixed safety response regardless of personality', async () => {
    const { reply, flaggedCrisis } = await generateReply({
      personality: 'creative_expressive',
      message: 'I want to kill myself',
      mood: 'sad',
    });
    expect(flaggedCrisis).toBe(true);
    expect(reply).toMatch(/988|crisis|emergency/i);
  });

  test('same message + personality + mood is deterministic (useful for caching/testing)', async () => {
    const params = { personality: 'analytical_insightful', message: 'I feel anxious about the interview', mood: 'anxious' };
    const first = await generateReply(params);
    const second = await generateReply(params);
    expect(first.reply).toBe(second.reply);
  });

  // Regression coverage for a genuine bug: the original hash function used
  // `h * prime` for 32-bit mixing, which silently loses precision in JS
  // (the product exceeds Number.MAX_SAFE_INTEGER), collapsing nearly every
  // input to the same bucket. This meant common everyday messages ("hi",
  // "ok", "thanks", "how are you") all produced the *exact same* reply.
  // Math.imul() fixes the 32-bit multiplication; this test locks it in.
  test('a batch of common everyday messages produces mostly distinct replies (no hash collapse)', async () => {
    const messages = [
      'hi', 'hello', 'hey', 'how are you', 'I am fine', 'I feel okay today',
      'what should I do', 'work is hard', 'can you help me', 'thanks',
      'I have an exam tomorrow', 'nothing to do today', 'I am so happy right now',
    ];
    const replies = new Set();
    for (const message of messages) {
      // eslint-disable-next-line no-await-in-loop
      const { reply } = await generateReply({ personality: 'warm_empathetic', message, mood: 'neutral' });
      replies.add(reply);
    }
    // Allow a small amount of natural overlap among near-identical greetings,
    // but the vast majority must be distinct — a collapsed hash would put
    // nearly all 13 messages into 1-2 buckets.
    expect(replies.size).toBeGreaterThanOrEqual(10);
  });
});
