import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGameHistory, saveGameSession } from '../services/gameService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import MemoryMatch from '../components/games/MemoryMatch';
import ReactionChallenge from '../components/games/ReactionChallenge';
import WordScramble from '../components/games/WordScramble';
import QuickQuiz from '../components/games/QuickQuiz';
import Loading from '../components/Loading';
import { FiPlayCircle, FiAward, FiSmile } from 'react-icons/fi';
import './Games.css';

const GAME_META = {
  memory_match: { name: 'Memory Match', component: MemoryMatch },
  reaction_challenge: { name: 'Reaction Challenge', component: ReactionChallenge },
  word_scramble: { name: 'Word Scramble', component: WordScramble },
  quick_quiz: { name: 'Quick Quiz', component: QuickQuiz },
};

export default function GamePlay() {
  const { gameType } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [key, setKey] = useState(0); // forces remount to restart the underlying game

  const meta = GAME_META[gameType];

  useEffect(() => {
    if (!meta) return;
    setLoadingHistory(true);
    getGameHistory(gameType)
      .then((data) => setHistory(data.sessions))
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameType, key]);

  if (!meta) {
    return (
      <div className="page">
        <div className="state-box">
          <div className="icon"><FiPlayCircle /></div>
          <h3>Unknown game</h3>
          <button className="btn btn-secondary mt-24" onClick={() => navigate('/games')}>Back to Games</button>
        </div>
      </div>
    );
  }

  const handleGameOver = async (score, durationSeconds, metadata) => {
    try {
      const data = await saveGameSession({ gameType, score, durationSeconds, metadata });
      setResult({ score, isNewHighScore: data.isNewHighScore });
      if (data.isNewHighScore) showToast('New high score!');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const GameComponent = meta.component;
  const highScore = history.length ? Math.max(...history.map((h) => h.score)) : 0;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1>{meta.name}</h1>
          <p>High score: {highScore}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/games')}>← All games</button>
      </div>

      <div className="card game-arena">
        {result ? (
          <div className="state-box">
            <div className="icon">{result.isNewHighScore ? <FiAward /> : <FiSmile />}</div>
            <h3>Game over — score: {result.score}</h3>
            {result.isNewHighScore && <p>New high score!</p>}
            <button className="btn btn-primary mt-24" onClick={() => { setResult(null); setKey((k) => k + 1); }}>
              Play again
            </button>
          </div>
        ) : (
          <GameComponent key={key} onGameOver={handleGameOver} />
        )}
      </div>

      <h2 className="mt-24">Your recent scores</h2>
      {loadingHistory ? (
        <Loading label="Loading history…" />
      ) : history.length === 0 ? (
        <p className="text-soft">No sessions yet — play a round above!</p>
      ) : (
        <ul className="mt-24">
          {history.slice(0, 10).map((s) => (
            <li key={s._id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <span>{new Date(s.createdAt).toLocaleString()}</span>
              <strong>{s.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
