import { useEffect, useState } from 'react';
import { createJournalEntry, deleteJournalEntry, getJournalEntries } from '../services/journalService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import MoodBadge from '../components/MoodBadge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { FiBookOpen } from 'react-icons/fi';

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    getJournalEntries()
      .then((data) => setEntries(data.journals))
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSubmitting(true);
    try {
      await createJournalEntry(form);
      setForm({ title: '', text: '' });
      showToast('Journal entry saved');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJournalEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mood Diary</h1>
        <p>What happened today? How are you feeling? Writing it down helps you notice patterns over time.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="jTitle">Title (optional)</label>
            <input id="jTitle" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A quick label for this entry" />
          </div>
          <div className="field">
            <label htmlFor="jText">What happened today? How are you feeling?</label>
            <textarea id="jText" required value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} maxLength={5000} placeholder="Write freely…" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save entry'}
          </button>
        </form>
      </div>

      <h2 className="mt-24">Your entries</h2>
      {loading ? (
        <Loading label="Loading journal…" />
      ) : entries.length === 0 ? (
        <EmptyState icon={<FiBookOpen />} title="No entries yet" description="Your first journal entry will appear here." />
      ) : (
        <div className="grid grid-2 mt-24">
          {entries.map((entry) => (
            <div className="card" key={entry._id}>
              <div className="flex-between">
                <strong>{entry.title || 'Untitled entry'}</strong>
                <MoodBadge emotion={entry.emotion} />
              </div>
              <p className="mt-24">{entry.text}</p>
              <div className="flex-between">
                <span className="text-soft" style={{ fontSize: '0.8rem' }}>{new Date(entry.createdAt).toLocaleString()}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(entry._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
