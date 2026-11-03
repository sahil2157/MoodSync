import { useI18n } from '../i18n';

// Big picture buttons so anyone can say how they feel with one tap,
// without reading or typing. The emoji carries the meaning; the label is
// shown in the person's chosen language.
export const MOOD_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', stressed: '😫', anxious: '😟',
  tired: '😴', bored: '😐', calm: '😌', excited: '🤩', neutral: '🙂',
};

const ORDER = ['happy', 'sad', 'angry', 'stressed', 'anxious', 'tired', 'bored', 'calm', 'excited', 'neutral'];

export default function MoodPicker({ selected, onPick, busy }) {
  const { t } = useI18n();
  return (
    <div className="mood-picker" role="group" aria-label={t('dash.howFeel')}>
      {ORDER.map((m) => (
        <button
          key={m}
          type="button"
          className={`mood-btn ${selected === m ? 'selected' : ''}`}
          style={{ '--mood-color': `var(--mood-${m})` }}
          onClick={() => onPick(m)}
          disabled={busy}
          aria-pressed={selected === m}
        >
          <span className="mood-emoji" aria-hidden="true">{MOOD_EMOJI[m]}</span>
          <span className="mood-label">{t(`mood.${m}`)}</span>
        </button>
      ))}
    </div>
  );
}
