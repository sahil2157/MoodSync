// Small helpers around the browser's built-in text-to-speech and voice typing
// (Web Speech API). Great for people who find reading or typing hard.
// No external service or API key is needed. Support depends on the browser/device.

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, langCode, onEnd) {
  if (!canSpeak() || !text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode || 'en-US';
  utter.rate = 0.92;
  utter.onend = () => onEnd && onEnd();
  utter.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function getRecognition() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}
