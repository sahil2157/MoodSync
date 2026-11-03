import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiZap, FiType, FiHelpCircle } from 'react-icons/fi';
import { listGames } from '../services/gameService';
import { getLatestMood } from '../services/moodService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import MoodBadge from '../components/MoodBadge';
import './Games.css';

// Mirrors server/services/recommendationService.js MOOD_MAP so the Games
// page can highlight the right pick immediately, without waiting on an
// extra /api/recommendations round trip.
const MOOD_TO_GAME = {
  happy: 'quick_quiz', sad: 'memory_match', angry: 'reaction_challenge', stressed: 'word_scramble',
  anxious: 'memory_match', bored: 'reaction_challenge', tired: 'word_scramble', calm: 'quick_quiz',
  excited: 'reaction_challenge', neutral: 'quick_quiz',
};

const GAME_ICONS = {
  memory_match: FiGrid,
  reaction_challenge: FiZap,
  word_scramble: FiType,
  quick_quiz: FiHelpCircle,
};

export default function Games() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestMood, setLatestMood] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([listGames(), getLatestMood().catch(() => ({ mood: null }))])
      .then(([gameData, moodData]) => {
        setGames(gameData.games);
        setLatestMood(moodData.mood);
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recommendedGameId = latestMood ? MOOD_TO_GAME[latestMood.emotion] : null;
  // Show the recommended game first so it's visually obvious it changes with mood
  const sortedGames = [...games].sort((a, b) => {
    if (a.id === recommendedGameId) return -1;
    if (b.id === recommendedGameId) return 1;
    return 0;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Games</h1>
        <p>Quick, entertaining mini-games — right here in MoodSync. Chosen for you based on your mood.</p>
      </div>

      {!loading && (
        latestMood ? (
          <div className="mood-banner">
            <span>
              Because you're feeling <MoodBadge emotion={latestMood.emotion} /> right now, we recommend{' '}
              <strong>{games.find((g) => g.id === recommendedGameId)?.name || 'a mini-game'}</strong> below.
            </span>
          </div>
        ) : (
          <div className="mood-banner">
            <span>Not sure what fits your mood? <Link to="/mood" className="btn-ghost" style={{ padding: 0, fontWeight: 700 }}>Check your mood first</Link> to get a personalized pick.</span>
          </div>
        )
      )}

      {loading ? (
        <Loading label="Loading games…" />
      ) : (
        <div className="grid grid-2">
          {sortedGames.map((g) => {
            const GameIcon = GAME_ICONS[g.id] || FiHelpCircle;
            return (
              <Link to={`/games/${g.id}`} className={`card game-card ${g.id === recommendedGameId ? 'recommended' : ''}`} key={g.id}>
                {g.id === recommendedGameId && <span className="recommended-tag">Recommended for you</span>}
                <div className="game-icon"><GameIcon /></div>
                <div>
                  <h3>{g.name}</h3>
                  <p>{g.description}</p>
                  <span className="text-soft" style={{ fontSize: '0.85rem' }}>High score: {g.highScore}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
