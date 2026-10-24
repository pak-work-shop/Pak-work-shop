import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Terminal, Wrench } from 'lucide-react';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';

export interface ConfigRequiredPageProps {
  missingVars: string[];
}

/**
 * Full-screen "Configuration required" page rendered when VITE_SUPABASE_URL
 * or VITE_SUPABASE_PUBLISHABLE_KEY is missing from environment variables (§2).
 */
export function ConfigRequiredPage({ missingVars }: ConfigRequiredPageProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-industrial-grid text-[#F5F6F8] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between py-2">
        <div className="inline-flex items-center gap-2.5">
          <span className="w-8 h-8 rounded bg-[#FF6A00] text-white inline-flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </span>
          <span className="font-heading font-bold text-xl tracking-wide text-white">
            {t('brand.name')}
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Main Card */}
      <main className="max-w-3xl w-full mx-auto my-8 rounded-lg bg-[#1B1F26] border border-white/15 p-6 sm:p-10 shadow-2xl text-start">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FFC21A] mb-3">
          <AlertCircle className="w-4 h-4" />
          <span>{t('configRequired.badge')}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white mb-3">
          {t('configRequired.title')}
        </h1>

        <p className="text-sm sm:text-base text-[#8A93A3] mb-6 leading-relaxed">
          {t('configRequired.description')}
        </p>

        {/* Missing Variables List */}
        <div className="rounded-md bg-[#0E1013] border border-[#DC2626]/40 p-4 mb-6">
          <h2 className="text-xs font-semibold text-red-400 mb-2.5 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>{t('configRequired.missingVarsTitle')}</span>
          </h2>
          <ul className="space-y-1.5 font-mono text-xs sm:text-sm text-[#F5F6F8]">
            {missingVars.map((varName) => (
              <li key={varName} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <code>{varName}</code>
              </li>
            ))}
          </ul>
        </div>

        {/* Setup Steps */}
        <div className="space-y-3 mb-6">
          <h2 className="text-base font-bold font-heading text-white">
            {t('configRequired.stepsTitle')}
          </h2>
          <ol className="space-y-2.5 text-sm text-[#8A93A3]">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0 mt-1" />
              <span>{t('configRequired.step1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0 mt-1" />
              <span>{t('configRequired.step2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0 mt-1" />
              <span>{t('configRequired.step3')}</span>
            </li>
          </ol>
        </div>

        {/* Example .env Snippet */}
        <pre
          dir="ltr"
          className="rounded-md bg-[#0E1013] border border-white/10 p-4 text-xs font-mono text-slate-300 overflow-x-auto text-left"
        >
{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key`}
        </pre>
      </main>

      <footer className="max-w-3xl w-full mx-auto text-center text-xs text-[#8A93A3] py-2">
        {t('configRequired.footerNote')}
      </footer>
    </div>
  );
}
