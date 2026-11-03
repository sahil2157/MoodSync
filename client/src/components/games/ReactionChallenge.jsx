import { useEffect, useRef, useState } from 'react';

const ROUNDS = 5;

export default function ReactionChallenge({ onGameOver }) {
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | waiting | ready | tooSoon | done
  const [times, setTimes] = useState([]);
  const timeoutRef = useRef(null);
  const showAtRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const startRound = () => {
    setStatus('waiting');
    const delay = 1000 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      showAtRef.current = Date.now();
      setStatus('ready');
    }, delay);
  };

  const handleClick = () => {
    if (status === 'idle' || status === 'tooSoon') {
      startRound();
      return;
    }
    if (status === 'waiting') {
      clearTimeout(timeoutRef.current);
      setStatus('tooSoon');
      return;
    }
    if (status === 'ready') {
      const reaction = Date.now() - showAtRef.current;
      const newTimes = [...times, reaction];
      setTimes(newTimes);
      if (newTimes.length >= ROUNDS) {
        const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
        const score = Math.max(1000 - Math.round(avg), 50);
        setStatus('done');
        onGameOver(score, Math.round((newTimes.length * avg) / 1000), { avgReactionMs: Math.round(avg), rounds: newTimes });
      } else {
        setRound((r) => r + 1);
        startRound();
      }
    }
  };

  const label = {
    idle: 'Tap to start',
    waiting: 'Wait for green…',
    ready: 'TAP NOW!',
    tooSoon: 'Too soon! Tap to retry',
    done: 'Round complete',
  }[status];

  return (
    <div className="flex-center" style={{ flexDirection: 'column' }}>
      <p>Round {Math.min(round + 1, ROUNDS)} of {ROUNDS}</p>
      <button
        className={`reaction-target ${status}`}
        onClick={handleClick}
        disabled={status === 'done'}
      >
        {label}
      </button>
      {times.length > 0 && (
        <p className="mt-24 text-soft">Last reaction: {times[times.length - 1]}ms</p>
      )}
      {status === 'done' && (
        <button className="btn btn-secondary mt-24" onClick={() => { setRound(0); setTimes([]); setStatus('idle'); }}>
          Restart
        </button>
      )}
    </div>
  );
}
