import type { LanguageCode, LocalizedStringList, LocalizedText } from '../types/database';

export const SUPPORTED_LANGUAGES: ReadonlyArray<{
  code: LanguageCode;
  label: string;
  dir: 'ltr' | 'rtl';
}> = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
  { code: 'ur-roman', label: 'Roman Urdu', dir: 'ltr' },
];

export function normalizeLangCode(lang?: string): LanguageCode {
  if (lang === 'ur' || lang === 'ur-roman' || lang === 'en') {
    return lang;
  }
  return 'en';
}

/**
 * Reads a translatable JSON field `{ en, ur, "ur-roman" }` from an object `obj[baseField]`
 * OR directly from a `LocalizedText` object when called as `getLocalized(localizedText, lang)`
 * and falls back to English ('en') when the requested language translation is empty/missing.
 */
export function getLocalized<T extends object>(
  obj: T | LocalizedText | string | null | undefined,
  baseFieldOrLang: keyof T | string = '',
  lang?: string
): string {
  if (!obj) {
    return '';
  }

  if (typeof obj === 'string') {
    return obj.trim();
  }

  if (typeof obj !== 'object') {
    return '';
  }

  const strField = typeof baseFieldOrLang === 'string' ? baseFieldOrLang : String(baseFieldOrLang);
  const isTwoArgCall =
    lang === undefined &&
    (strField === '' ||
      strField === 'en' ||
      strField === 'ur' ||
      strField === 'ur-roman' ||
      strField.startsWith('en-') ||
      strField.startsWith('ur-'));

  const resolvedLang = normalizeLangCode(
    isTwoArgCall ? String(baseFieldOrLang || 'en') : lang
  );

  let target: unknown = obj;
  if (
    !isTwoArgCall &&
    baseFieldOrLang !== '' &&
    (baseFieldOrLang as string) in obj
  ) {
    target = (obj as Record<string, unknown>)[baseFieldOrLang as string];
  }

  if (!target || typeof target !== 'object') {
    if (typeof target === 'string') {
      return target.trim();
    }
    return '';
  }

  const record = target as Record<string, unknown>;
  const localizedValue = record[resolvedLang];
  if (typeof localizedValue === 'string' && localizedValue.trim().length > 0) {
    return localizedValue.trim();
  }

  const englishFallback = record['en'];
  if (typeof englishFallback === 'string' && englishFallback.trim().length > 0) {
    return englishFallback.trim();
  }

  return '';
}

/**
 * Reads a translatable string-array field `{ en: string[], ur: string[], "ur-roman": string[] }`
 * and falls back to the English array when the current language array is empty or missing.
 */
export function getLocalizedList<T extends object>(
  obj: T | LocalizedStringList | null | undefined,
  baseField: keyof T | '' = '',
  lang: string = 'en'
): string[] {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  const normalizedLang = normalizeLangCode(lang);

  let target: unknown = obj;
  if (baseField !== '' && baseField in obj) {
    target = (obj as Record<string, unknown>)[baseField as string];
  }

  if (!target || typeof target !== 'object') {
    return [];
  }

  const record = target as Record<string, unknown>;
  const localizedArr = record[normalizedLang];
  if (Array.isArray(localizedArr)) {
    const cleaned = localizedArr
      .filter((item): item is string => typeof item === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  const englishArr = record['en'];
  if (Array.isArray(englishArr)) {
    return englishArr
      .filter((item): item is string => typeof item === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}
