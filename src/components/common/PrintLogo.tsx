import React from 'react';
import { useSiteSettings } from '../../features/settings/useSiteSettings';

interface PrintLogoProps {
  className?: string;
}

/**
 * Print-optimized logo renderer:
 * 1. Uses `settings.print_logo_url` when set (designed for white paper/transparent dark text).
 * 2. Otherwise shows `settings.logo_url` inside a small charcoal (#0E1013) rounded badge so light logos stay crisp on white paper.
 * 3. If neither is set, falls back to the business wordmark in dark text.
 */
export function PrintLogo({ className = '' }: PrintLogoProps) {
  const { settings } = useSiteSettings();

  const printLogoUrl = settings.print_logo_url;
  const regularLogoUrl = settings.logo_url;
  const businessName = settings.business_name || 'Pak Auto Works & Parts';

  if (printLogoUrl) {
    return (
      <div className={`inline-block ${className}`}>
        <img
          src={printLogoUrl}
          alt={businessName}
          referrerPolicy="no-referrer"
          className="h-12 w-auto object-contain max-w-[200px]"
        />
      </div>
    );
  }

  if (regularLogoUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg bg-[#0E1013] px-3.5 py-2 shadow-xs ${className}`}
      >
        <img
          src={regularLogoUrl}
          alt={businessName}
          referrerPolicy="no-referrer"
          className="h-9 w-auto object-contain max-w-[180px]"
        />
      </div>
    );
  }

  return (
    <div className={`font-black tracking-tight text-slate-900 font-heading text-xl ${className}`}>
      {businessName}
    </div>
  );
}
