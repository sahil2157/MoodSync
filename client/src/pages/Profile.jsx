import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

const PERSONALITIES = [
  { id: 'warm_empathetic', label: 'Warm & Empathetic' },
  { id: 'professional_structured', label: 'Professional & Structured' },
  { id: 'analytical_insightful', label: 'Analytical & Insightful' },
  { id: 'supportive_encouraging', label: 'Supportive & Encouraging' },
  { id: 'creative_expressive', label: 'Creative & Expressive' },
];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [personality, setPersonality] = useState(user?.preferences?.defaultCounsellorPersonality || 'warm_empathetic');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await refreshProfile({ name, preferences: { defaultCounsellorPersonality: personality } });
      showToast('Profile updated');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account and preferences.</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={user?.email} disabled />
          </div>
          <div className="field">
            <label htmlFor="personality">Default counsellor personality</label>
            <select id="personality" value={personality} onChange={(e) => setPersonality(e.target.value)}>
              {PERSONALITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card mt-24" style={{ maxWidth: 480 }}>
        <h3>About MoodSync</h3>
        <p>
          MoodSync is a wellness and productivity companion. It is not a substitute for
          professional mental health care, and does not diagnose medical conditions. If you are in
          crisis, please contact your local emergency number or a crisis helpline immediately.
        </p>
      </div>
    </div>
  );
}
