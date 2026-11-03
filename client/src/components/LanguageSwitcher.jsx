import { FiGlobe } from 'react-icons/fi';
import { useI18n } from '../i18n';

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, languages, t } = useI18n();
  return (
    <label className={`lang-switch ${compact ? 'compact' : ''}`}>
      <FiGlobe aria-hidden="true" />
      <span className="sr-only">{t('lang.label')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('lang.label')}>
        {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
      </select>
    </label>
  );
}
