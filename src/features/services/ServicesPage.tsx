import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info, Search, X } from 'lucide-react';
import { formatServicePriceLabel, useServices } from './useServices';
import { getLocalized } from '../../i18n/helpers';
import { Button, EmptyState, Skeleton } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { ServiceIcon } from '../../components/common/ServiceIcon';
import { getLocalFallbackForImage } from '../../lib/imageFallbacks';
import { WorkshopIllustration } from '../../components/common/WorkshopIllustration';

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const { services, loading, error, reload } = useServices();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;

    return services.filter((service) => {
      const name = getLocalized(service, 'name', i18n.language).toLowerCase();
      const shortDesc = getLocalized(
        service,
        'short_description',
        i18n.language
      ).toLowerCase();
      const fullDesc = getLocalized(
        service,
        'description',
        i18n.language
      ).toLowerCase();
      return name.includes(q) || shortDesc.includes(q) || fullDesc.includes(q);
    });
  }, [services, searchQuery, i18n.language]);

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo
        title={t('services.seoTitle')}
        description={t('services.seoDescription')}
        canonicalPath="/services"
      />

      <PageHeader
        title={t('services.pageTitle')}
        subtitle={t('services.pageSubtitle')}
        breadcrumbs={[{ label: t('nav.services') }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Search Bar + Price Estimate Disclaimer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('services.searchPlaceholder')}
              aria-label={t('services.searchPlaceholder')}
              className="w-full rounded-md ps-10 pe-9 py-2.5 text-sm bg-[#F5F6F8] text-[#12151A] placeholder:text-slate-400 border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('services.clearSearch')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 text-start">
            <Info className="w-4 h-4 text-[#FF6A00] shrink-0" />
            <span>{t('services.priceDisclaimer')}</span>
          </div>
        </div>

        {/* Content Grid / States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-72 w-full bg-slate-200" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title={t('common.errorTitle')}
            description={t('common.errorDescription')}
            action={
              <Button variant="primary" onClick={() => void reload(true)}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : filteredServices.length === 0 ? (
          <EmptyState
            title={t('services.emptyTitle')}
            description={t('services.emptyDescription')}
            className="bg-white border-slate-200 text-[#12151A]"
            action={
              searchQuery ? (
                <Button variant="primary" onClick={() => setSearchQuery('')}>
                  {t('services.clearSearch')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const name = getLocalized(service, 'name', i18n.language);
              const shortDesc = getLocalized(
                service,
                'short_description',
                i18n.language
              );
              const priceLabel = formatServicePriceLabel(service, t);
              const priceNote = getLocalized(service, 'price_note', i18n.language);
              const imgUrl = service.image_url?.trim();

              return (
                <article
                  key={service.id}
                  className="rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden text-start"
                >
                  <div>
                    <Link
                      to={`/services/${service.slug}`}
                      className="block aspect-video w-full overflow-hidden bg-[#1B1F26] border-b border-slate-200"
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            const image = event.currentTarget;
                            if (image.dataset.imageFallbackApplied === 'true') return;
                            image.dataset.imageFallbackApplied = 'true';
                            image.src = getLocalFallbackForImage(imgUrl);
                          }}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <WorkshopIllustration
                          serviceSlug={service.slug}
                          title={name}
                          aspectRatio="video"
                          className="rounded-none border-0"
                        />
                      )}
                    </Link>

                    <div className="p-6 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-11 h-11 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center shrink-0">
                          <ServiceIcon name={service.icon} className="w-5 h-5" />
                        </div>
                      </div>

                      <h2 className="text-xl font-bold font-heading text-[#12151A]">
                        <Link
                          to={`/services/${service.slug}`}
                          className="hover:text-[#FF6A00] transition-colors"
                        >
                          {name}
                        </Link>
                      </h2>

                      {shortDesc && (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {shortDesc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">
                        {t('services.detail.priceEstimate')}
                      </span>
                      <p className="text-sm font-bold text-[#12151A]">{priceLabel}</p>
                      {priceNote && (
                        <p className="text-xs text-slate-500 mt-0.5">{priceNote}</p>
                      )}
                    </div>

                    <Link to={`/services/${service.slug}`} className="w-full">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                      >
                        {t('services.viewDetails')}
                      </Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
