import { useEffect, useState } from 'react';
import { getGameAssets } from '../../services/gameService';

export default function QuickQuiz({ onGameOver }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    getGameAssets('quick_quiz').then((data) => {
      setQuestions(data.questions);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading quiz…</p>;
  if (!questions.length) return <p>Could not load quiz. Please try again.</p>;

  const current = questions[index];

  const handleAnswer = (option) => {
    if (selected) return;
    setSelected(option);
    const correct = option === current.answer;
    if (correct) setScore((s) => s + 100);

    setTimeout(() => {
      setSelected(null);
      if (index + 1 >= questions.length) {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        onGameOver(score + (correct ? 100 : 0), durationSeconds, { total: questions.length });
      } else {
        setIndex((i) => i + 1);
      }
    }, 800);
  };

  return (
    <div>
      <p>Question {index + 1} of {questions.length} · Score: {score}</p>
      <h3 className="mt-24">{current.question}</h3>
      <div className="grid grid-2 mt-24">
        {current.options.map((opt) => {
          let cls = 'quiz-option';
          if (selected) {
            if (opt === current.answer) cls += ' correct';
            else if (opt === selected) cls += ' wrong';
          }
          return (
            <button key={opt} className={cls} onClick={() => handleAnswer(opt)} disabled={!!selected}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
