import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Info,
  MessageCircle,
} from 'lucide-react';
import { formatServicePriceLabel, useService } from './useServices';
import { useFaqs } from '../faq/useFaqs';
import { useSiteSettings } from '../settings/useSiteSettings';
import { useServiceLinkedProducts } from '../catalogue/useCatalogueData';
import { ProductCard } from '../catalogue/ProductCard';
import { getLocalized, getLocalizedList } from '../../i18n/helpers';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Accordion, Button, EmptyState, ImageSlot, Skeleton } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { ServiceIcon } from '../../components/common/ServiceIcon';
import { WorkshopIllustration } from '../../components/common/WorkshopIllustration';
import { JsonLd, buildServiceJsonLd } from '../../components/common/JsonLd';

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const { service, relatedServices, loading } = useService(slug);
  const { faqs: serviceFaqs } = useFaqs({
    serviceId: service?.id ?? '__none__',
  });
  const { products: linkedProducts } = useServiceLinkedProducts(
    service?.id ?? '__none__'
  );

  if (loading) {
    return (
      <div className="bg-[#F5F6F8] min-h-[75vh] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-12 w-2/3 bg-slate-200" />
          <Skeleton className="h-80 w-full bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-[#0E1013] min-h-[75vh] flex items-center justify-center py-16 px-4">
        <Seo title={t('services.detail.notFoundTitle')} />
        <div className="max-w-xl w-full">
          <EmptyState
            title={t('services.detail.notFoundTitle')}
            description={t('services.detail.notFoundDescription')}
            action={
              <Link to="/services">
                <Button
                  variant="primary"
                  leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
                >
                  {t('services.detail.backToServices')}
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const name = getLocalized(service, 'name', i18n.language);
  const shortDesc = getLocalized(service, 'short_description', i18n.language);
  const fullDesc = getLocalized(service, 'description', i18n.language);
  const includesList = getLocalizedList(service, 'includes', i18n.language);
  const estimatedTime = getLocalized(service, 'estimated_time', i18n.language);
  const priceLabel = formatServicePriceLabel(service, t);
  const priceNote = getLocalized(service, 'price_note', i18n.language);
  const imgUrl = service.image_url?.trim();

  const whatsapp = settings.whatsapp || settings.phone || '03126776844';
  const whatsappMessage = t('services.detail.whatsappPreFill', { service: name });
  const whatsappHref = buildWhatsAppUrl(whatsapp, whatsappMessage);

  const faqAccordionItems = serviceFaqs
    .map((f) => ({
      id: f.id,
      question: getLocalized(f, 'question', i18n.language),
      answer: getLocalized(f, 'answer', i18n.language),
    }))
    .filter((item) => item.question && item.answer);

  const serviceJsonLd = buildServiceJsonLd(service, settings, i18n.language);

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo
        title={name}
        description={shortDesc || fullDesc}
        canonicalPath={`/services/${service.slug}`}
        ogImage={imgUrl}
      />
      <JsonLd data={serviceJsonLd} />

      <PageHeader
        title={name}
        subtitle={shortDesc}
        breadcrumbs={[
          { label: t('nav.services'), href: '/services' },
          { label: name },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left / Main Details Column */}
          <div className="lg:col-span-8 space-y-8 text-start">
            {/* Image or Per-Slug SVG Illustration (overridden when admin sets image_url) */}
            {imgUrl ? (
              <ImageSlot
                src={imgUrl}
                alt={name}
                label={name}
                aspectRatio="video"
                className="shadow-md border-slate-200"
              />
            ) : (
              <WorkshopIllustration
                serviceSlug={service.slug}
                title={name}
                aspectRatio="video"
                className="shadow-md border-slate-200"
              />
            )}

            {/* Full Description */}
            {fullDesc && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 space-y-3">
                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                  {fullDesc}
                </p>
              </div>
            )}

            {/* What's Included */}
            {includesList.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#12151A]">
                  {t('services.detail.whatsIncluded')}
                </h2>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {includesList.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Service-Specific FAQs (hidden if none) */}
            {faqAccordionItems.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#12151A]">
                  {t('services.detail.serviceFaqs')}
                </h2>
                <Accordion
                  items={faqAccordionItems}
                  lightMode
                  defaultOpenId={faqAccordionItems[0]?.id}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar: Price, Estimated Time & CTAs */}
          <aside className="lg:col-span-4 space-y-6 text-start">
            <div className="rounded-lg bg-[#0E1013] text-[#F5F6F8] border border-white/15 p-6 sm:p-7 space-y-6">
              {/* Price Estimate */}
              <div className="space-y-1.5 pb-5 border-b border-white/10">
                <span className="text-xs font-semibold text-[#8A93A3] block">
                  {t('services.detail.priceEstimate')}
                </span>
                <p className="text-2xl font-bold font-heading text-[#FFC21A]">
                  {priceLabel}
                </p>
                {priceNote && (
                  <p className="text-xs text-[#F5F6F8]/80 pt-1">{priceNote}</p>
                )}
                <p className="text-xs text-[#8A93A3] flex items-center gap-1.5 pt-2">
                  <Info className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                  <span>{t('services.priceDisclaimer')}</span>
                </p>
              </div>

              {/* Estimated Time (Shown ONLY when set) */}
              {estimatedTime && (
                <div className="flex items-start gap-3 pb-5 border-b border-white/10">
                  <Clock className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-[#8A93A3] block">
                      {t('services.detail.estimatedTime')}
                    </span>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {estimatedTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Primary & Secondary Action Buttons */}
              <div className="space-y-3">
                <Link
                  to={`/book?service=${encodeURIComponent(service.slug)}`}
                  className="block"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<CalendarCheck className="w-4 h-4" />}
                  >
                    {t('services.detail.bookThisService')}
                  </Button>
                </Link>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
                  >
                    {t('services.detail.askOnWhatsapp')}
                  </Button>
                </a>
              </div>
            </div>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#FF6A00] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip" />
              <span>{t('services.detail.backToServices')}</span>
            </Link>
          </aside>
        </div>

        {/* Compatible Parts We Stock for This Service (Phase 5) */}
        {linkedProducts.length > 0 && (
          <section className="pt-8 border-t border-slate-200 space-y-6 text-start">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-heading text-[#12151A]">
                  {t('services.detail.compatiblePartsTitle')}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {t('services.detail.compatiblePartsSubtitle')}
                </p>
              </div>
              <Link to="/shop">
                <Button
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                >
                  {t('home.browseAllParts')}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {linkedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {/* Related Services (3 other active services) */}
        {relatedServices.length > 0 && (
          <section className="pt-8 border-t border-slate-200 space-y-6 text-start">
            <h2 className="text-2xl font-bold font-heading text-[#12151A]">
              {t('services.detail.relatedServices')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedServices.map((rel) => {
                const relName = getLocalized(rel, 'name', i18n.language);
                const relShort = getLocalized(
                  rel,
                  'short_description',
                  i18n.language
                );
                const relPrice = formatServicePriceLabel(rel, t);
                const relImg = rel.image_url?.trim();

                return (
                  <Link
                    key={rel.id}
                    to={`/services/${rel.slug}`}
                    className="group rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] overflow-hidden flex flex-col justify-between transition-all shadow-xs"
                  >
                    <div>
                      {relImg ? (
                        <div className="aspect-video w-full overflow-hidden bg-[#1B1F26] border-b border-slate-200">
                          <img
                            src={relImg}
                            alt={relName}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <WorkshopIllustration
                          serviceSlug={rel.slug}
                          title={relName}
                          aspectRatio="video"
                          className="rounded-none border-0 border-b border-slate-200"
                        />
                      )}
                      <div className="p-6 pb-2 space-y-3">
                        <div className="w-10 h-10 rounded bg-[#0E1013] text-[#FF6A00] flex items-center justify-center">
                          <ServiceIcon name={rel.icon} className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold font-heading text-[#12151A] group-hover:text-[#FF6A00]">
                          {relName}
                        </h3>
                        {relShort && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {relShort}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{relPrice}</span>
                      <span className="inline-flex items-center gap-1 text-[#FF6A00]">
                        <span>{t('services.viewDetails')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
