import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMusicByCategory, searchMusic } from '../services/musicService';
import { getLatestMood } from '../services/moodService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import MoodBadge from '../components/MoodBadge';
import { FiMusic, FiPlay, FiPause, FiExternalLink } from 'react-icons/fi';
import './Music.css';

const CATEGORIES = ['relax', 'happy', 'focus', 'energy', 'motivation', 'sleep', 'chill'];

// Mirrors server/services/recommendationService.js MOOD_MAP so the Music
// page can default to the right category the moment it loads, without an
// extra round trip through /api/recommendations.
const MOOD_TO_MUSIC_CATEGORY = {
  happy: 'happy', sad: 'happy', angry: 'relax', stressed: 'relax', anxious: 'chill',
  bored: 'energy', tired: 'sleep', calm: 'focus', excited: 'energy', neutral: 'chill',
};

export default function Music() {
  const [category, setCategory] = useState(null); // null until we know the user's mood
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [nowPlaying, setNowPlaying] = useState(null);
  const [source, setSource] = useState('local');
  const [latestMood, setLatestMood] = useState(null);
  const { showToast } = useToast();

  const loadCategory = (cat) => {
    setLoading(true);
    getMusicByCategory(cat)
      .then((data) => { setTracks(data.tracks); setSource(data.source); })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  // On first load, read the user's most recent mood check-in and default
  // the category to whatever fits that mood, instead of always "chill".
  useEffect(() => {
    getLatestMood()
      .then((data) => {
        setLatestMood(data.mood);
        const initial = data.mood ? (MOOD_TO_MUSIC_CATEGORY[data.mood.emotion] || 'chill') : 'chill';
        setCategory(initial);
      })
      .catch(() => setCategory('chill'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (category) loadCategory(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchMusic(query);
      setTracks(data.tracks);
      setSource(data.source);
      if (!data.tracks.length) showToast('No results — try the mood categories instead.');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Music</h1>
        <p>Mood-matched tracks, streamed via Jamendo's official free API. No other apps needed.</p>
      </div>

      {latestMood ? (
        <div className="mood-banner">
          <span>Because you're feeling <MoodBadge emotion={latestMood.emotion} /> right now, we've picked the <strong style={{ textTransform: 'capitalize' }}>{MOOD_TO_MUSIC_CATEGORY[latestMood.emotion] || 'chill'}</strong> category for you.</span>
        </div>
      ) : (
        <div className="mood-banner">
          <span>Not sure what fits your mood? <Link to="/mood" className="btn-ghost" style={{ padding: 0, fontWeight: 700 }}>Check your mood first</Link> for a tailored pick.</span>
        </div>
      )}

      <form className="music-search" onSubmit={handleSearch}>
        <input type="text" placeholder="Search for a song or artist…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      <div className="category-row">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`personality-chip ${category === c ? 'active' : ''}`}
            onClick={() => { setQuery(''); setCategory(c); }}
            type="button"
          >
            {c}
          </button>
        ))}
      </div>

      {source === 'local' && !loading && (
        <p className="text-soft" style={{ fontSize: '0.85rem' }}>
          Showing locally cached tracks (add a MUSIC_API_KEY on the server for live streaming previews).
        </p>
      )}

      {loading ? (
        <Loading label="Finding tracks…" />
      ) : tracks.length === 0 ? (
        <EmptyState icon={<FiMusic />} title="No tracks found" description="Try a different mood category or search term." />
      ) : (
        <div className="grid grid-3 mt-24">
          {tracks.map((t) => (
            <div className="card track-card" key={t.id}>
              <div className="track-art" style={{ backgroundImage: t.artwork ? `url(${t.artwork})` : undefined }}>
                {!t.artwork && <FiMusic />}
              </div>
              <div className="track-info">
                <strong>{t.title}</strong>
                <span className="text-soft">{t.artist}</span>
              </div>
              <div className="flex gap-8 mt-24">
                {t.previewUrl ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setNowPlaying(nowPlaying === t.id ? null : t.id)}
                  >
                    {nowPlaying === t.id ? (<><FiPause /> Pause</>) : (<><FiPlay /> Play preview</>)}
                  </button>
                ) : (
                  <span className="btn btn-secondary btn-sm" style={{ cursor: 'default' }}>Preview unavailable</span>
                )}
                {t.externalUrl && (
                  <a className="btn btn-ghost btn-sm" href={t.externalUrl} target="_blank" rel="noreferrer">Open <FiExternalLink /></a>
                )}
              </div>
              {nowPlaying === t.id && t.previewUrl && (
                <audio className="mt-24" src={t.previewUrl} controls autoPlay style={{ width: '100%' }} onEnded={() => setNowPlaying(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
