import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Settings } from 'lucide-react';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { useAuth } from '../../features/auth/useAuth';

export function DemoModeBanner() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const { isAdmin } = useAuth();

  if (!settings.demo_mode) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label={t('demo.bannerTitle')}
      className="bg-[#1B1F26] border-b border-[#FFC21A]/30 text-[#F5F6F8] px-4 py-1.5 text-xs print:hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-start">
          <span className="inline-flex items-center gap-1 rounded bg-[#FFC21A]/15 border border-[#FFC21A]/40 px-2 py-0.5 text-[11px] font-semibold text-[#FFC21A] shrink-0">
            <FlaskConical className="w-3 h-3" />
            <span>{t('demo.badge')}</span>
          </span>
          <span className="text-[#F5F6F8]/90">{t('demo.bannerText')}</span>
        </div>

        {isAdmin && (
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-1 font-semibold text-[#FF6A00] hover:underline shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t('demo.manageInSettings')}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
