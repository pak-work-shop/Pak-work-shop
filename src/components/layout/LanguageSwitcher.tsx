import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, normalizeLangCode } from '../../i18n/helpers';
import type { LanguageCode } from '../../types/database';
import { cn } from '../../lib/utils';

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const activeLang = normalizeLangCode(i18n.language);

  const handleLanguageChange = (code: LanguageCode) => {
    void i18n.changeLanguage(code);
  };

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md bg-[#0E1013] border border-white/15 p-0.5',
        className
      )}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = activeLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleLanguageChange(lang.code)}
            aria-pressed={isActive}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
              isActive
                ? 'bg-[#FF6A00] text-white font-semibold'
                : 'text-[#8A93A3] hover:text-white'
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
