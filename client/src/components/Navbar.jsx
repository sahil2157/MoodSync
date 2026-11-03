import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiBarChart2, FiActivity, FiMessageCircle, FiMusic, FiPlayCircle,
  FiFeather, FiBookOpen, FiTarget, FiUser, FiSun, FiMoon, FiLogOut, FiShield,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const LINKS = [
  { to: '/dashboard', key: 'nav.dashboard', Icon: FiBarChart2 },
  { to: '/mood', key: 'nav.mood', Icon: FiActivity },
  { to: '/music', key: 'nav.music', Icon: FiMusic },
  { to: '/games', key: 'nav.games', Icon: FiPlayCircle },
  { to: '/quotes', key: 'nav.quotes', Icon: FiFeather },
  { to: '/journal', key: 'nav.journal', Icon: FiBookOpen },
  { to: '/goals', key: 'nav.goals', Icon: FiTarget },
  { to: '/profile', key: 'nav.profile', Icon: FiUser },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">MS</span>
          <span className="brand-name">MoodSync</span>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-icon" aria-hidden="true" />
              <span>{t(key)}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link admin-link ${isActive ? 'active' : ''}`}
            >
              <FiShield className="sidebar-icon" aria-hidden="true" />
              <span>{t('nav.admin')}</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <LanguageSwitcher />
          <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <FiMoon /> : <FiSun />}
            {theme === 'light' ? t('nav.dark') : t('nav.light')}
          </button>
          <div className="sidebar-user">
            <span className="user-avatar" style={{ background: user?.avatarColor || '#146c64' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
            <div>
              <div className="user-name">{user?.name}</div>
              <button className="btn-ghost logout-btn" onClick={handleLogout}>
                <FiLogOut size={13} /> {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <nav className="bottom-tabs">
        {LINKS.slice(0, 4).map(({ to, Icon, key }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`} aria-label={t(key)}>
            <Icon />
          </NavLink>
        ))}
        <NavLink
          to={isAdmin ? '/admin' : '/profile'}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
          aria-label={isAdmin ? t('nav.admin') : t('nav.profile')}
        >
          {isAdmin ? <FiShield /> : <FiUser />}
        </NavLink>
      </nav>
    </>
  );
}
