import { useEffect, useState } from 'react';
import { getGameAssets } from '../../services/gameService';

export default function WordScramble({ onGameOver }) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    getGameAssets('word_scramble').then((data) => {
      setWords(data.words);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading words…</p>;
  if (!words.length) return <p>Could not load words. Please try again.</p>;

  const current = words[index];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guess.trim().toLowerCase() === current.word.toLowerCase()) {
      setScore((s) => s + 100);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setTimeout(() => {
      setFeedback('');
      setGuess('');
      if (index + 1 >= words.length) {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        onGameOver(score + (guess.trim().toLowerCase() === current.word.toLowerCase() ? 100 : 0), durationSeconds, { total: words.length });
      } else {
        setIndex((i) => i + 1);
      }
    }, 700);
  };

  return (
    <div className="flex-center" style={{ flexDirection: 'column' }}>
      <p>Word {index + 1} of {words.length} · Score: {score}</p>
      <div className={`scramble-word ${feedback}`}>{current.scrambled}</div>
      <form onSubmit={handleSubmit} className="flex gap-12 mt-24">
        <input
          type="text"
          value={guess}
          autoFocus
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess"
          style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
}
