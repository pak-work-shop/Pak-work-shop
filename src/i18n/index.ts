import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur.json';
import urRoman from './locales/ur-roman.json';
import { normalizeLangCode } from './helpers';
import { safeGetLocalStorage, safeSetLocalStorage } from '../lib/utils';
import type { LanguageCode } from '../types/database';

const LANGUAGE_STORAGE_KEY = 'pak_auto_lang';

function getInitialLanguage(): LanguageCode {
  const saved = safeGetLocalStorage(LANGUAGE_STORAGE_KEY);
  return normalizeLangCode(saved ?? 'en');
}

export function applyDocumentLanguageAttributes(lang: LanguageCode): void {
  if (typeof document === 'undefined') return;
  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
}

const initialLanguage = getInitialLanguage();
applyDocumentLanguageAttributes(initialLanguage);

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
    'ur-roman': { translation: urRoman },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (newLang: string) => {
  const normalized = normalizeLangCode(newLang);
  safeSetLocalStorage(LANGUAGE_STORAGE_KEY, normalized);
  applyDocumentLanguageAttributes(normalized);
});

export default i18n;
