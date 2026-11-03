import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiMusic, FiPlayCircle, FiFeather, FiTarget } from 'react-icons/fi';
import { analyzeMood } from '../services/moodService';
import { getRecommendations } from '../services/recommendationService';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import { getErrorMessage } from '../services/api';
import MoodBadge from '../components/MoodBadge';
import Loading from '../components/Loading';

export default function MoodCheck() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { t } = useI18n();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setBundle(null);
    try {
      const { mood } = await analyzeMood(text);
      setResult(mood);
      const recRes = await getRecommendations();
      setBundle(recRes.bundle);
      showToast(t('m.analyzed'));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('m.title')}</h1>
        <p>{t('m.sub')}</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 24 }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="moodText">{t('m.label')}</label>
              <textarea
                id="moodText"
                placeholder={t('m.placeholder')}
                dir="auto"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('m.analyzing') : t('m.analyze')}
            </button>
          </form>
        </div>

        <div className="card">
          {loading && <Loading label={t('m.reading')} />}
          {!loading && !result && (
            <div className="state-box">
              <div className="icon"><FiActivity /></div>
              <p style={{ margin: '0 auto' }}>{t('m.resultHere')}</p>
            </div>
          )}
          {!loading && result && (
            <div>
              <h3>{t('m.current')}</h3>
              <MoodBadge emotion={result.emotion} size="lg" />
              <p className="mt-24"><strong>{t('m.confidence')}:</strong> {(result.confidence * 100).toFixed(0)}%</p>
              <p><strong>{t('m.intensity')}:</strong> <span>{t(`int.${result.intensity}`)}</span></p>
              <p>{result.interpretation}</p>
            </div>
          )}
        </div>
      </div>

      {bundle && (
        <div className="card mt-24">
          <h3>{t('m.recommended')}</h3>
          <div className="grid grid-2 mt-24">
            <div className="card card-accent">
              <strong><FiMusic /> {t('dash.music')}</strong>
              <p>{t('dash.playlist', { name: t(`cat.${bundle.musicCategory}`) })}</p>
              <Link to="/music" className="btn btn-secondary btn-sm">{t('m.openMusic')}</Link>
            </div>
            <div className="card card-accent">
              <strong><FiPlayCircle /> {t('dash.game')}</strong>
              <p>{t(`game.${bundle.game}`)}</p>
              <Link to={`/games/${bundle.game}`} className="btn btn-secondary btn-sm">{t('m.playNow')}</Link>
            </div>
            <div className="card card-accent">
              <strong><FiFeather /> {t('dash.quote')}</strong>
              <p>{t(`cat.${String(bundle.quoteCategory).replace(/[\s-]+/g, '_')}`)}</p>
              <Link to="/quotes" className="btn btn-secondary btn-sm">{t('m.seeQuotes')}</Link>
            </div>
            <div className="card card-accent">
              <strong><FiTarget /> {t('m.small')}</strong>
              <p>{t(`act.${bundle.mood}`)}{bundle.negativeStreak ? ` ${t('act.gentle')}` : ''}</p>
              <Link to="/goals" className="btn btn-secondary btn-sm">{t('m.addGoal')}</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
