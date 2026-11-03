import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiActivity, FiPercent, FiZap, FiCheckCircle, FiClock,
} from 'react-icons/fi';
import { getMoodHistory, getLatestMood, quickMood } from '../services/moodService';
import { getGoals } from '../services/goalService';
import { getJournalEntries } from '../services/journalService';
import { getRecommendations } from '../services/recommendationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import MoodPicker from '../components/MoodPicker';
import MoodSuggestions from '../components/MoodSuggestions';
import { getErrorMessage } from '../services/api';
import MoodBadge from '../components/MoodBadge';
import Loading from '../components/Loading';

const EMOTION_SCORE = {
  happy: 9, excited: 9, calm: 7, neutral: 5, bored: 4,
  tired: 4, anxious: 3, stressed: 3, sad: 2, angry: 2,
};

const MOOD_COLORS = {
  happy: 'var(--mood-happy)', sad: 'var(--mood-sad)', angry: 'var(--mood-angry)',
  stressed: 'var(--mood-stressed)', anxious: 'var(--mood-anxious)', bored: 'var(--mood-bored)',
  tired: 'var(--mood-tired)', calm: 'var(--mood-calm)', excited: 'var(--mood-excited)', neutral: 'var(--mood-neutral)',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [picking, setPicking] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestMood, setLatestMood] = useState(null);
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState([]);
  const [journals, setJournals] = useState([]);
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getLatestMood(),
      getMoodHistory(14),
      getGoals(),
      getJournalEntries(3),
    ])
      .then(([latest, hist, goalData, journalData]) => {
        setLatestMood(latest.mood);
        setHistory(hist.moods);
        setGoals(goalData.goals);
        setJournals(journalData.journals);
        if (latest.mood) {
          return getRecommendations().then((r) => setBundle(r.bundle));
        }
        return null;
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (emotion) => {
    setPicking(true);
    try {
      const { mood } = await quickMood(emotion);
      setLatestMood(mood);
      setHistory((prev) => [mood, ...prev]);
      const r = await getRecommendations();
      setBundle(r.bundle);
      setJustSaved(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setPicking(false);
    }
  };

  const chartData = [...history].reverse().map((m) => ({
    date: new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: EMOTION_SCORE[m.emotion] || 5,
    emotion: m.emotion,
  }));

  // Build a mood-distribution breakdown for the pie chart from the same history
  const distribution = Object.entries(
    history.reduce((acc, m) => {
      acc[m.emotion] = (acc[m.emotion] || 0) + 1;
      return acc;
    }, {})
  ).map(([emotion, count]) => ({ name: t(`mood.${emotion}`), key: emotion, value: count }));

  if (loading) return <div className="page"><Loading label={t('dash.loading')} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('dash.welcome', { name: user?.name?.split(' ')[0] || '' })}</h1>
      </div>

      <section className="card mood-picker-card" aria-labelledby="howfeel">
        <h2 id="howfeel" className="howfeel-title">{t('dash.howFeel')}</h2>
        <p className="howfeel-sub">{t('dash.tapOne')}</p>
        <MoodPicker selected={justSaved ? latestMood?.emotion : null} onPick={handlePick} busy={picking} />
      </section>

      <MoodSuggestions bundle={bundle} justSaved={justSaved} />

      {latestMood && (
        <>
          <div className="grid grid-3">
            <div className="card card-accent">
              <span className="stat-label"><FiActivity /> {t('dash.current')}</span>
              <div className="mt-24"><MoodBadge emotion={latestMood.emotion} size="lg" /></div>
            </div>
            <div className="card card-accent">
              <span className="stat-label"><FiPercent /> {t('dash.confidence')}</span>
              <h2 className="mt-24">{(latestMood.confidence * 100).toFixed(0)}%</h2>
            </div>
            <div className="card card-accent">
              <span className="stat-label"><FiZap /> {t('dash.intensity')}</span>
              <h2 className="mt-24">{t(`int.${latestMood.intensity}`)}</h2>
            </div>
          </div>

          <div className="grid mt-24" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
            <div className="card">
              <h3>{t('dash.trend')}</h3>
              {chartData.length < 2 ? (
                <p>{t('dash.trendEmpty')}</p>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--sage)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--sage)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                      <XAxis dataKey="date" stroke="var(--text-soft)" fontSize={12} />
                      <YAxis domain={[0, 10]} stroke="var(--text-soft)" fontSize={12} />
                      <Tooltip
                        formatter={(value, name, props) => [t(`mood.${props.payload.emotion}`), t('dash.moodWord')]}
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }}
                      />
                      <Area type="monotone" dataKey="score" stroke="var(--sage)" strokeWidth={3} fill="url(#moodGradient)" dot={{ r: 4, fill: 'var(--sage)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card">
              <h3>{t('dash.breakdown')}</h3>
              {distribution.length === 0 ? (
                <p>{t('dash.noData')}</p>
              ) : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {distribution.map((entry) => (
                          <Cell key={entry.key} fill={MOOD_COLORS[entry.key] || 'var(--mood-neutral)'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }} />
                      <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

        </>
      )}

      <div className="grid grid-2 mt-24">
        <div className="card">
          <div className="flex-between">
            <h3>{t('dash.goals')}</h3>
            <Link to="/goals" className="btn btn-ghost btn-sm">{t('dash.viewAll')}</Link>
          </div>
          {goals.length === 0 ? (
            <p>{t('dash.noGoals')}</p>
          ) : (
            <ul className="mt-24">
              {goals.slice(0, 5).map((g) => (
                <li key={g._id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ textDecoration: g.completed ? 'line-through' : 'none' }}>{g.title}</span>
                  {g.completed ? <FiCheckCircle color="var(--sage)" /> : <FiClock color="var(--text-soft)" />}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <div className="flex-between">
            <h3>{t('dash.journal')}</h3>
            <Link to="/journal" className="btn btn-ghost btn-sm">{t('dash.viewAll')}</Link>
          </div>
          {journals.length === 0 ? (
            <p>{t('dash.noJournal')}</p>
          ) : (
            <ul className="mt-24">
              {journals.map((j) => (
                <li key={j._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="flex-between">
                    <strong>{j.title || 'Untitled'}</strong>
                    <MoodBadge emotion={j.emotion} />
                  </div>
                  <p style={{ margin: '4px 0 0' }}>{j.text.slice(0, 90)}{j.text.length > 90 ? '…' : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
