import { Link } from 'react-router-dom';
import {
  FiActivity, FiTarget, FiMusic, FiPlayCircle, FiTrendingUp, FiArrowRight, FiSmile, FiGlobe, FiMessageCircle,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Home.css';

const FEATURES = [
  { Icon: FiSmile, id: 'f1' },
  { Icon: FiGlobe, id: 'f2' },
  { Icon: FiMessageCircle, id: 'f3' },
  { Icon: FiMusic, id: 'f4' },
  { Icon: FiPlayCircle, id: 'f5' },
  { Icon: FiTrendingUp, id: 'f6' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="brand-mark">MS</span>
          <span className="brand-name">MoodSync</span>
        </div>
        <div className="flex gap-12 landing-actions">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">{t('h.goDash')}</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">{t('h.login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('h.start')}</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">{t('h.eyebrow')}</span>
          <h1>{t('h.title1')}<br />{t('h.title2')}</h1>
          <p className="hero-sub">{t('h.sub')}</p>
          <div className="hero-actions">
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary">{t('h.check')} <FiArrowRight className="flip-rtl" /></Link>
            
          </div>
          <p className="hero-disclaimer">{t('h.disclaimer')}</p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="pulse-ring ring-1"></div>
          <div className="pulse-ring ring-2"></div>
          <div className="pulse-core">
            <FiSmile /><FiActivity /><FiTarget /><FiTrendingUp />
          </div>
        </div>
      </section>

      <section className="flow">
        <h2>{t('h.how')}</h2>
        <div className="flow-steps">
          {['h.s1', 'h.s2', 'h.s3'].map((key, i) => (
            <div className="flow-step" key={key}>
              <span className="flow-index">{i + 1}</span>
              <span>{t(key)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <h2>{t('h.features')}</h2>
        <div className="grid grid-3">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.id}>
              <div className="feature-icon"><f.Icon /></div>
              <h3>{t(`h.${f.id}t`)}</h3>
              <p>{t(`h.${f.id}d`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>{t('h.cta')}</h2>
        <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary">{t('h.ctaBtn')} <FiArrowRight className="flip-rtl" /></Link>
      </section>

      <footer className="landing-footer">
        <p>{t('h.footer')}</p>
      </footer>
    </div>
  );
}
