import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle } from 'lucide-react';
import type { LanguageCode, LocalizedText } from '../../types/database';
import { SUPPORTED_LANGUAGES } from '../../i18n/helpers';
import { cn } from '../../lib/utils';

export interface TranslatableFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: LocalizedText | string;
  hint?: string;
  error?: string;
  maxLength?: number;
  requiredEn?: boolean;
}

export function TranslatableField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  placeholder,
  hint,
  error,
  maxLength,
  requiredEn = false,
}: TranslatableFieldProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LanguageCode>('en');

  const currentVal = value?.[activeTab] ?? '';
  const isRtl = activeTab === 'ur';

  const resolvedPlaceholder =
    typeof placeholder === 'string'
      ? placeholder
      : placeholder?.[activeTab] || placeholder?.en || '';

  const handleFieldChange = (newText: string) => {
    onChange({
      en: value?.en ?? '',
      ur: value?.ur ?? '',
      'ur-roman': value?.['ur-roman'] ?? '',
      [activeTab]: newText,
    });
  };

  return (
    <div className="w-full space-y-2 text-start">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium text-[#F5F6F8]">
          {label}
          {requiredEn && <span className="text-[#FF6A00] ms-1">*</span>}
        </label>

        {/* 3-Language Tabs with Filled / Empty indicator */}
        <div
          role="tablist"
          aria-label={label}
          className="inline-flex items-center rounded-md bg-[#0E1013] p-1 border border-white/10"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = activeTab === lang.code;
            const isFilled = Boolean(value?.[lang.code]?.trim());

            return (
              <button
                key={lang.code}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(lang.code)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
                  isSelected
                    ? 'bg-[#FF6A00] text-white font-semibold'
                    : 'text-[#8A93A3] hover:text-white'
                )}
              >
                {isFilled ? (
                  <CheckCircle2
                    className={cn(
                      'w-3 h-3 shrink-0',
                      isSelected ? 'text-white' : 'text-emerald-400'
                    )}
                    aria-label={t('admin.shared.filled')}
                  />
                ) : (
                  <Circle
                    className="w-3 h-3 shrink-0 opacity-40"
                    aria-label={t('admin.shared.empty')}
                  />
                )}
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {multiline ? (
        <textarea
          dir={isRtl ? 'rtl' : 'ltr'}
          rows={rows}
          maxLength={maxLength}
          value={currentVal}
          onChange={(e) => handleFieldChange(e.target.value)}
          placeholder={resolvedPlaceholder}
          className={cn(
            'w-full rounded-md px-3.5 py-2.5 text-sm bg-[#1B1F26] text-[#F5F6F8] placeholder:text-[#8A93A3]/70 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00] transition-colors resize-y',
            error && 'border-[#EF4444]'
          )}
        />
      ) : (
        <input
          type="text"
          dir={isRtl ? 'rtl' : 'ltr'}
          maxLength={maxLength}
          value={currentVal}
          onChange={(e) => handleFieldChange(e.target.value)}
          placeholder={resolvedPlaceholder}
          className={cn(
            'w-full rounded-md px-3.5 py-2.5 text-sm bg-[#1B1F26] text-[#F5F6F8] placeholder:text-[#8A93A3]/70 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00] transition-colors',
            error && 'border-[#EF4444]'
          )}
        />
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <div>
          {error ? (
            <p role="alert" className="text-[#EF4444]">
              {error}
            </p>
          ) : hint ? (
            <p className="text-[#8A93A3]">{hint}</p>
          ) : null}
        </div>

        {maxLength && (
          <span dir="ltr" className="text-[#8A93A3] tabular-nums shrink-0">
            {currentVal.length} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
