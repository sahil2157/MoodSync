import { useEffect, useState } from 'react';
import { FiVolume2, FiSquare } from 'react-icons/fi';
import { useI18n } from '../i18n';
import { canSpeak, speak, stopSpeaking } from '../utils/speech';

// Reads text aloud in the right language (browser text-to-speech).
export default function ListenButton({ text, speechLang, size = 'sm' }) {
  const { t, speechLang: uiSpeech } = useI18n();
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSpeaking(), []);
  if (!canSpeak() || !text) return null;

  const toggle = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speak(text, speechLang || uiSpeech, () => setPlaying(false));
  };

  return (
    <button type="button" className={`btn btn-secondary btn-${size} listen-btn`} onClick={toggle}>
      {playing ? <FiSquare /> : <FiVolume2 />} {playing ? t('dash.stop') : t('dash.listen')}
    </button>
  );
}
