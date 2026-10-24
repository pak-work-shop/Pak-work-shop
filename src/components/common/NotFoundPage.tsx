import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageCircle, Compass } from 'lucide-react';
import { useSiteSettings } from '../../features/settings/useSiteSettings';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Button } from '../ui/Button';
import { Seo } from './Seo';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp || settings.phone || '03126776844',
    t('whatsapp.defaultMessage')
  );

  return (
    <section className="min-h-[72vh] flex items-center justify-center px-4 py-16 bg-industrial-grid">
      <Seo title={t('notFound.seoTitle')} />

      <div className="max-w-lg w-full rounded-lg bg-[#1B1F26] border border-white/15 p-8 sm:p-10 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-[#2A2F38] border border-[#FF6A00]/30 text-[#FF6A00] flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7" />
        </div>

        <p className="text-4xl sm:text-5xl font-bold font-heading text-[#FF6A00] tabular-nums mb-1">
          {t('notFound.code')}
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-3">
          {t('notFound.title')}
        </h1>

        <p className="text-sm text-[#8A93A3] mb-8">{t('notFound.description')}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
              className="w-full sm:w-auto"
            >
              {t('notFound.backHome')}
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
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
              className="w-full sm:w-auto"
            >
              {t('notFound.contactWhatsapp')}
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
