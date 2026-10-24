import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageCircle, Settings } from 'lucide-react';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Button } from '../ui/Button';
import { Seo } from './Seo';

export interface ComingSoonProps {
  pageKey?: string;
  pageTitle?: string;
}

export function ComingSoon({ pageKey, pageTitle }: ComingSoonProps) {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  const resolvedPageName = pageTitle
    ? pageTitle
    : pageKey
    ? t(pageKey)
    : '';

  const heading = resolvedPageName
    ? t('comingSoon.title', { page: resolvedPageName })
    : t('comingSoon.defaultTitle');

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp || settings.phone || '03126776844',
    t('whatsapp.defaultMessage')
  );

  return (
    <section className="min-h-[72vh] flex items-center justify-center px-4 py-16 bg-industrial-grid">
      <Seo title={resolvedPageName || t('comingSoon.defaultTitle')} />

      <div className="max-w-xl w-full rounded-lg bg-[#1B1F26] border border-white/15 p-8 sm:p-10 text-center shadow-2xl">
        {/* Subtle Animated Dual Gear Graphic */}
        <div
          className="relative w-24 h-20 mx-auto mb-6 flex items-center justify-center"
          aria-hidden="true"
        >
          <Settings
            className="w-14 h-14 text-[#FF6A00] animate-[spin_12s_linear_infinite]"
            strokeWidth={1.75}
          />
          <Settings
            className="w-9 h-9 text-[#FFC21A] -ms-2 mt-6 animate-[spin_9s_linear_infinite_reverse]"
            strokeWidth={1.75}
          />
        </div>

        <p className="text-xs font-semibold tracking-wider text-[#FFC21A] mb-2">
          {t('comingSoon.badge')}
        </p>

        <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white mb-3 text-balance">
          {heading}
        </h1>

        <p className="text-sm sm:text-base text-[#8A93A3] max-w-md mx-auto mb-8 leading-relaxed">
          {t('comingSoon.description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
              className="w-full sm:w-auto"
            >
              {t('comingSoon.backHome')}
            </Button>
          </Link>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
              className="w-full sm:w-auto"
            >
              {t('comingSoon.contactWhatsapp')}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

export default ComingSoon;
