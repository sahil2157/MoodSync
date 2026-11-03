import { useEffect, useState } from 'react';
import { createGoal, deleteGoal, getGoals, updateGoal } from '../services/goalService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { FiTarget } from 'react-icons/fi';

const CATEGORIES = ['health', 'study', 'mindfulness', 'productivity', 'social', 'other'];
const SUGGESTIONS = ['Drink enough water', 'Study for 30 minutes', 'Walk for 15 minutes', 'Sleep on time', 'Practice breathing', 'Complete one task'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    getGoals()
      .then((data) => setGoals(data.goals))
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createGoal({ title, category });
      setTitle('');
      showToast('Goal added');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleToggle = async (goal) => {
    try {
      const data = await updateGoal(goal._id, { completed: !goal.completed });
      setGoals((prev) => prev.map((g) => (g._id === goal._id ? data.goal : g)));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progress = goals.length ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Goals</h1>
        <p>Small, achievable wellness and productivity goals — checked off one at a time.</p>
      </div>

      <div className="card">
        <form onSubmit={handleAdd} className="flex gap-12" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
            <label htmlFor="goalTitle">New goal</label>
            <input id="goalTitle" list="goal-suggestions" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Walk for 15 minutes" />
            <datalist id="goal-suggestions">
              {SUGGESTIONS.map((s) => <option value={s} key={s} />)}
            </datalist>
          </div>
          <div className="field" style={{ minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="goalCategory">Category</label>
            <select id="goalCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Add Goal</button>
        </form>
      </div>

      {!loading && goals.length > 0 && (
        <div className="card mt-24">
          <div className="flex-between">
            <strong>Today's progress</strong>
            <span>{completedCount}/{goals.length} complete</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg)', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--sage)', transition: 'width .3s ease' }} />
          </div>
        </div>
      )}

      <h2 className="mt-24">Your goals</h2>
      {loading ? (
        <Loading label="Loading goals…" />
      ) : goals.length === 0 ? (
        <EmptyState icon={<FiTarget />} title="No goals yet" description="Add your first small goal above." />
      ) : (
        <div className="grid grid-2 mt-24">
          {goals.map((goal) => (
            <div className="card flex-between" key={goal._id}>
              <label className="flex gap-12" style={{ alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={goal.completed} onChange={() => handleToggle(goal)} style={{ width: 20, height: 20 }} />
                <span style={{ textDecoration: goal.completed ? 'line-through' : 'none', color: goal.completed ? 'var(--text-soft)' : 'var(--text)' }}>
                  {goal.title}
                  <br />
                  <span className="text-soft" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{goal.category}</span>
                </span>
              </label>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(goal._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
