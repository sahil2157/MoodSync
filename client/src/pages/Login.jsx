import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getErrorMessage } from '../services/api';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast(t('a.toastLogin'));
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-lang"><LanguageSwitcher /></div>
        <div className="auth-brand">
          <span className="brand-mark">MS</span>
          <span className="brand-name">MoodSync</span>
        </div>
        <h2>{t('a.welcome')}</h2>
        <p>{t('a.loginSub')}</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">{t('a.email')}</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">{t('a.password')}</label>
            <input id="password" name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? t('a.loggingIn') : t('a.login')}
          </button>
        </form>
        <p className="auth-switch">{t('a.noAccount')} <Link to="/register">{t('a.signUp')}</Link></p>
      </div>
    </div>
  );
}
