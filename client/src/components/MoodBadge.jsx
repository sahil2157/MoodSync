import {
  FiSmile, FiFrown, FiAlertTriangle, FiCloud, FiWind,
  FiMeh, FiMoon, FiSun, FiZap, FiCircle,
} from 'react-icons/fi';
import { useI18n } from '../i18n';

const ICON_MAP = {
  happy: FiSmile,
  sad: FiFrown,
  angry: FiAlertTriangle,
  stressed: FiCloud,
  anxious: FiWind,
  bored: FiMeh,
  tired: FiMoon,
  calm: FiSun,
  excited: FiZap,
  neutral: FiCircle,
};

export default function MoodBadge({ emotion = 'neutral', size = 'md' }) {
  const { t } = useI18n();
  const color = `var(--mood-${emotion})`;
  const Icon = ICON_MAP[emotion] || FiCircle;
  return (
    <span
      className="badge"
      style={{ background: color, fontSize: size === 'lg' ? '1rem' : '0.82rem', padding: size === 'lg' ? '10px 18px' : undefined }}
    >
      <Icon aria-hidden="true" />
      <span>{t(`mood.${emotion}`)}</span>
    </span>
  );
}
