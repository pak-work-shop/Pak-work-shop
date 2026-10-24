import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, CheckCircle2, Truck } from 'lucide-react';
import { usePage } from './usePage';
import { getLocalized } from '../../i18n/helpers';
import { formatPKR } from '../../lib/format';
import { useCart } from '../cart/CartContext';
import { Button, EmptyState, Skeleton } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { Markdown } from '../../components/common/Markdown';
import type { LegalPageSlug } from '../../types/database';

export interface LegalPageProps {
  slug: LegalPageSlug;
}

export default function LegalPage({ slug }: LegalPageProps) {
  const { t, i18n } = useTranslation();
  const { page, loading } = usePage(slug);
  const { deliverySettings } = useCart();

  if (loading) {
    return (
      <div className="bg-[#F5F6F8] min-h-[75vh] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-12 w-1/2 bg-slate-200" />
          <Skeleton className="h-96 w-full bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-[#0E1013] min-h-[75vh] flex items-center justify-center py-16 px-4">
        <Seo title={t('legal.notFoundTitle')} />
        <div className="max-w-xl w-full">
          <EmptyState
            title={t('legal.notFoundTitle')}
            description={t('legal.notFoundDescription')}
            action={
              <Link to="/">
                <Button
                  variant="primary"
                  leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
                >
                  {t('notFound.backHome')}
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const title = getLocalized(page, 'title', i18n.language);
  const content = getLocalized(page, 'content', i18n.language);

  const localeTag = i18n.language === 'ur' ? 'ur-PK' : 'en-PK';
  let formattedDate = '';
  try {
    formattedDate = new Date(page.updated_at).toLocaleDateString(localeTag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    formattedDate = page.updated_at.slice(0, 10);
  }

  const freeCitiesList =
    deliverySettings.free_cities && deliverySettings.free_cities.length > 0
      ? deliverySettings.free_cities.join(', ')
      : 'Sadiqabad';
  const flatRateFormatted = formatPKR(deliverySettings.flat_rate ?? 300);

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo title={title} canonicalPath={`/${slug}`} />

      <PageHeader title={title} breadcrumbs={[{ label: title }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
        {slug === 'delivery-policy' && (
          <div className="rounded-lg bg-[#0E1013] text-[#F5F6F8] border-s-4 border-s-[#FF6A00] p-5 sm:p-6 shadow-md text-start space-y-3">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#FF6A00] shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t('cart.delivery.policyLiveTitle')}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="rounded bg-[#1B1F26] border border-emerald-500/30 p-3.5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300 block">
                    {t('cart.delivery.freeBadge')} — {freeCitiesList}
                  </span>
                  <span className="text-xs text-[#8A93A3]">
                    {t('cart.delivery.freeInCityDesc', {
                      city: freeCitiesList,
                    })}
                  </span>
                </div>
              </div>
              <div className="rounded bg-[#1B1F26] border border-white/10 p-3.5 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#FFC21A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#FFC21A] block">
                    {t('cart.delivery.nationwideFlatRate', {
                      rate: flatRateFormatted,
                    })}
                  </span>
                  <span className="text-xs text-[#8A93A3]">
                    {deliverySettings.free_over_amount
                      ? t('cart.delivery.freeOverThresholdHint', {
                          amount: formatPKR(deliverySettings.free_over_amount),
                        })
                      : t('cart.delivery.flatRateOtherCitiesDesc', {
                          rate: flatRateFormatted,
                        })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <article className="rounded-lg bg-white border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6 text-start">
          <div className="flex items-center gap-2 text-xs text-slate-500 pb-4 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-[#FF6A00]" />
            <span>{t('legal.lastUpdated', { date: formattedDate })}</span>
          </div>

          <Markdown content={content} lightMode />
        </article>
      </div>
    </div>
  );
}
