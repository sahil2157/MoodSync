import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en';
import hi from './locales/hi';
import te from './locales/te';
import ta from './locales/ta';
import bn from './locales/bn';
import es from './locales/es';
import fr from './locales/fr';
import ar from './locales/ar';

// Add a new language: create locales/xx.js, import it here and add one line below.
// Any key missing from a language automatically falls back to English.
export const LANGUAGES = [
  { code: 'en', name: 'English', speech: 'en-US', dict: en },
  { code: 'hi', name: 'हिन्दी', speech: 'hi-IN', dict: hi },
  { code: 'te', name: 'తెలుగు', speech: 'te-IN', dict: te },
  { code: 'ta', name: 'தமிழ்', speech: 'ta-IN', dict: ta },
  { code: 'bn', name: 'বাংলা', speech: 'bn-IN', dict: bn },
  { code: 'es', name: 'Español', speech: 'es-ES', dict: es },
  { code: 'fr', name: 'Français', speech: 'fr-FR', dict: fr },
  { code: 'ar', name: 'العربية', speech: 'ar-SA', dict: ar, rtl: true },
];

const STORAGE_KEY = 'moodsync_lang';

function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch (e) { /* storage unavailable */ }
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGUAGES.some((l) => l.code === browser) ? browser : 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLanguage);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = current.code;
    document.documentElement.dir = current.rtl ? 'rtl' : 'ltr';
    try { localStorage.setItem(STORAGE_KEY, current.code); } catch (e) { /* ignore */ }
  }, [current]);

  const setLang = useCallback((code) => setLangState(code), []);

  const t = useCallback((key, vars) => {
    let text = current.dict[key] ?? en[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => { text = text.replaceAll(`{${k}}`, String(v)); });
    }
    return text;
  }, [current]);

  const value = useMemo(
    () => ({ t, lang: current.code, speechLang: current.speech, setLang, languages: LANGUAGES, rtl: !!current.rtl }),
    [t, current, setLang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
