import { useEffect, useState } from 'react';

const EMOJIS = ['🌿', '🌊', '☀️', '🌙', '🎈', '🍀', '🌸', '⭐'];

function buildDeck() {
  const pairs = [...EMOJIS, ...EMOJIS];
  return pairs
    .map((value, i) => ({ id: i, value, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

export default function MemoryMatch({ onGameOver }) {
  const [deck, setDeck] = useState(buildDeck());
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [finished, setFinished] = useState(false);

  const matchedCount = deck.filter((c) => c.matched).length;

  useEffect(() => {
    if (matchedCount === deck.length && !finished) {
      setFinished(true);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const score = Math.max(1000 - moves * 20 - durationSeconds * 2, 50);
      onGameOver(score, durationSeconds, { moves });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount]);

  const handleFlip = (card) => {
    if (finished || card.flipped || card.matched || selected.length === 2) return;
    const newDeck = deck.map((c) => (c.id === card.id ? { ...c, flipped: true } : c));
    const newSelected = [...selected, card.id];
    setDeck(newDeck);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newSelected;
      const first = newDeck.find((c) => c.id === firstId);
      const second = newDeck.find((c) => c.id === secondId);
      if (first.value === second.value) {
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, matched: true } : c)));
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c)));
          setSelected([]);
        }, 700);
      }
    }
  };

  const restart = () => {
    setDeck(buildDeck());
    setSelected([]);
    setMoves(0);
    setFinished(false);
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <span>Moves: {moves}</span>
        <button className="btn btn-secondary btn-sm" onClick={restart}>Restart</button>
      </div>
      <div className="memory-grid">
        {deck.map((card) => (
          <button
            key={card.id}
            className={`memory-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleFlip(card)}
          >
            {card.flipped || card.matched ? card.value : '❔'}
          </button>
        ))}
      </div>
    </div>
  );
}
