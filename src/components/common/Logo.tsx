import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { BRAND_ASSETS } from '../../lib/defaultImages';
import { cn } from '../../lib/utils';

export interface LogoProps {
  className?: string;
  compact?: boolean;
}

/**
 * Renders the owner's uploaded logo if `site_settings.logo_url` is set;
 * otherwise renders the Section B1 logo or the clean brand lockup.
 */
export function Logo({ className, compact = false }: LogoProps) {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const [imgError, setImgError] = useState(false);

  const logoUrl = settings.logo_url?.trim() || BRAND_ASSETS.logo_url;
  const displayName = settings.business_name?.trim()
    ? settings.business_name.toUpperCase()
    : t('brand.name');

  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] rounded-sm shrink-0 group',
        className
      )}
    >
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt={settings.business_name || 'Pak Auto Works & Parts'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={cn(
            'w-auto object-contain transition-all duration-150',
            compact ? 'h-8' : 'h-9 sm:h-10'
          )}
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex items-center justify-center rounded bg-[#FF6A00] text-white shrink-0 transition-transform duration-150 group-hover:scale-105',
              compact ? 'w-7 h-7' : 'w-8 h-8'
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span
            className={cn(
              'font-heading font-bold tracking-wide text-white whitespace-nowrap',
              compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
            )}
          >
            {displayName}
          </span>
        </>
      )}
    </Link>
  );
}
