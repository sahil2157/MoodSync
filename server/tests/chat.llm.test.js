// Tests the OpenAI-backed counsellor path with node-fetch mocked (no real API call).
jest.mock('node-fetch', () => jest.fn());
const fetch = require('node-fetch');

process.env.AI_API_KEY = 'test-key';
process.env.AI_MODEL = 'gpt-4o';
const { generateReply } = require('../services/chatService');

const okResponse = (obj) => ({
  ok: true,
  json: async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] }),
});

describe('chatService - OpenAI counsellor', () => {
  beforeEach(() => fetch.mockReset());

  test('sends a multilingual system prompt, history and JSON mode to OpenAI', async () => {
    fetch.mockResolvedValue(okResponse({ reply: 'मैं आपकी बात सुन रहा हूँ।', language: 'hi', emotion: 'sad', risk: 'none' }));
    const history = Array.from({ length: 25 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
    const out = await generateReply({ personality: 'warm_empathetic', message: 'मुझे बहुत अकेलापन लग रहा है', mood: 'neutral', history, uiLanguage: 'en' });

    expect(out.reply).toBe('मैं आपकी बात सुन रहा हूँ।');
    expect(out.language).toBe('hi');
    expect(out.emotion).toBe('sad');
    expect(out.flaggedCrisis).toBe(false);

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/chat\/completions$/);
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('gpt-4o');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0].content).toMatch(/language AND script/i);
    // system + 20 history turns + current message
    expect(body.messages).toHaveLength(22);
    expect(body.messages[body.messages.length - 1].content).toBe('मुझे बहुत अकेलापन लग रहा है');
  });

  test('model-detected crisis in any language is flagged and its own localized reply is kept', async () => {
    fetch.mockResolvedValue(okResponse({ reply: 'Estoy aquí contigo. ¿Estás a salvo ahora?', language: 'es', emotion: 'sad', risk: 'high' }));
    const out = await generateReply({ personality: 'warm_empathetic', message: 'ya no quiero estar aquí', mood: 'sad', history: [] });
    expect(out.flaggedCrisis).toBe(true);
    expect(out.reply).toMatch(/Estoy aquí/);
  });

  test('keyword safety-net still flags crisis if the model said risk none', async () => {
    fetch.mockResolvedValue(okResponse({ reply: 'ok', language: 'en', emotion: 'sad', risk: 'none' }));
    const out = await generateReply({ personality: 'warm_empathetic', message: 'I want to kill myself', mood: 'sad', history: [] });
    expect(out.flaggedCrisis).toBe(true);
    expect(out.reply).toMatch(/988/);
  });

  test('falls back to the local responder if the API fails', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests', text: async () => 'rate limit' });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const out = await generateReply({ personality: 'warm_empathetic', message: 'I feel so anxious about tomorrow', mood: 'anxious', history: [] });
    expect(out.reply.length).toBeGreaterThan(10);
    expect(out.flaggedCrisis).toBe(false);
    spy.mockRestore();
  });

  test('uses plain text if the model ignores the JSON format', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'Just plain text reply' } }] }) });
    const out = await generateReply({ personality: 'warm_empathetic', message: 'hello there friend', mood: 'neutral', history: [] });
    expect(out.reply).toBe('Just plain text reply');
  });
});
