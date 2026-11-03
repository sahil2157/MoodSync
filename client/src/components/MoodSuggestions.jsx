import { Link } from 'react-router-dom';
import { FiMusic, FiPlayCircle, FiFeather, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { useI18n } from '../i18n';
import { MOOD_EMOJI } from './MoodPicker';
import ListenButton from './ListenButton';

// Simple, icon-led suggestion cards shown right after a mood is chosen.
export default function MoodSuggestions({ bundle, justSaved }) {
  const { t } = useI18n();
  if (!bundle) return null;

  const moodName = t(`mood.${bundle.mood}`);
  const activityText = t(`act.${bundle.mood}`) + (bundle.negativeStreak ? ` ${t('act.gentle')}` : '');
  const spoken = `${t('dash.because', { mood: moodName })} ${activityText}`;

  return (
    <div className="card suggestions-card mt-24">
      <div className="flex-between suggestions-head">
        <div>
          {justSaved && <p className="suggest-saved">{t('dash.saved')}</p>}
          <h2 className="suggest-title">
            <span aria-hidden="true">{MOOD_EMOJI[bundle.mood]}</span> {t('dash.because', { mood: moodName })}
          </h2>
        </div>
        <ListenButton text={spoken} />
      </div>

      <div className="suggest-grid">
        <Link to="/music" className="suggest-tile">
          <FiMusic className="suggest-icon" />
          <strong>{t('dash.music')}</strong>
          <span>{t('dash.playlist', { name: t(`cat.${bundle.musicCategory}`) })}</span>
        </Link>
        <Link to={`/games/${bundle.game}`} className="suggest-tile">
          <FiPlayCircle className="suggest-icon" />
          <strong>{t('dash.game')}</strong>
          <span>{t(`game.${bundle.game}`)}</span>
        </Link>
        <Link to="/quotes" className="suggest-tile">
          <FiFeather className="suggest-icon" />
          <strong>{t('dash.quote')}</strong>
          <span>{t(`cat.${String(bundle.quoteCategory).replace(/[\s-]+/g, '_')}`)}</span>
        </Link>
        <Link to="/counsellor" className="suggest-tile suggest-talk">
          <FiMessageCircle className="suggest-icon" />
          <strong>{t('nav.counsellor')}</strong>
          <span>{t('dash.talk')}</span>
        </Link>
      </div>

      <div className="suggest-activity">
        <FiHeart className="suggest-icon" />
        <div>
          <strong>{t('dash.activity')}</strong>
          <p>{activityText}</p>
        </div>
      </div>
    </div>
  );
}
