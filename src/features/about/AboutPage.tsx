import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CalendarCheck,
  MessageCircle,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useSiteSettings } from '../settings/useSiteSettings';
import { useServices } from '../services/useServices';
import { getLocalized } from '../../i18n/helpers';
import { Button, ImageSlot } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionHeading } from '../../components/common/SectionHeading';
import { ServiceIcon } from '../../components/common/ServiceIcon';
import { WorkshopIllustration } from '../../components/common/WorkshopIllustration';
import type { ReviewSummary } from '../../types/database';

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const [reviewSummary, setReviewSummary] = React.useState<ReviewSummary | null>(null);

  React.useEffect(() => {
    if (!env.isConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_review_summary');
        if (!cancelled && !error && data) {
          setReviewSummary(data as unknown as ReviewSummary);
        }
      } catch {
        // graceful fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const { services: featuredServices } = useServices({
    featuredOnly: true,
    limit: 6,
  });

  const aboutTitle =
    getLocalized(settings, 'about_title', i18n.language) ||
    t('about.defaultTitle');
  const rawAboutBody =
    getLocalized(settings, 'about_body', i18n.language) ||
    t('about.defaultBody');

  const paragraphs = rawAboutBody
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const aboutImageUrl = settings.about_image_url?.trim() || '';

  const pillars = [
    { key: 'repair', icon: Wrench, href: '/services' },
    { key: 'parts', icon: PackageCheck, href: '/shop' },
    { key: 'tracking', icon: SearchCheck, href: '/track' },
  ] as const;

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo
        title={t('about.seoTitle')}
        description={t('about.seoDescription')}
        canonicalPath="/about"
        ogImage={aboutImageUrl || undefined}
      />

      <PageHeader
        title={aboutTitle}
        breadcrumbs={[{ label: t('nav.about') }]}
      />

      {/* Average Customer Rating Strip (Shown when reviews exist) */}
      {reviewSummary && reviewSummary.total_reviews > 0 && (
        <section className="bg-[#12151A] text-white py-3 px-4 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center text-[#FFC21A]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(reviewSummary.average_rating)
                        ? 'fill-[#FFC21A]'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-white tabular-nums">
                {reviewSummary.average_rating.toFixed(1)} / 5.0
              </span>
              <span className="text-[#8A93A3]">
                ({reviewSummary.total_reviews} {t('footer.reviews', 'Reviews')})
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Customer Feedback</span>
              </span>
            </div>
            <Link
              to="/reviews"
              className="text-[#FF6A00] hover:text-[#ff8533] font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>{t('home.viewAllReviews', 'View All Reviews')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
            </Link>
          </div>
        </section>
      )}

      {/* 1. ABOUT OVERVIEW & IMAGE SLOT */}
      <section className="py-12 sm:py-16 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5 text-start">
            <h2 className="text-2xl sm:text-4xl font-bold font-heading text-[#12151A] heading-accent mb-4">
              {aboutTitle}
            </h2>

            <div className="space-y-4">
              {paragraphs.map((para, idx) => (
                <p
                  key={idx}
                  className="text-sm sm:text-base text-slate-700 leading-relaxed"
                >
                  {para}
                </p>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link to="/services">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                >
                  {t('about.exploreServicesBtn')}
                </Button>
              </Link>

              <Link to="/book">
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<CalendarCheck className="w-4 h-4 text-[#FF6A00]" />}
                >
                  {t('home.ctaBook')}
                </Button>
              </Link>

              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#12151A] hover:bg-slate-100"
                  leftIcon={<MessageCircle className="w-4 h-4 text-[#FF6A00]" />}
                >
                  {t('about.contactUsBtn')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            {aboutImageUrl ? (
              <ImageSlot
                src={aboutImageUrl}
                alt={aboutTitle}
                label={t('about.imageSlotLabel')}
                subtext={t('about.imageSlotSubtext')}
                aspectRatio="video"
                className="shadow-md"
              />
            ) : (
              <WorkshopIllustration
                variant="about-workshop"
                title={t('about.imageSlotLabel')}
                aspectRatio="video"
                className="shadow-md"
              />
            )}
          </div>
        </div>
      </section>

      {/* 2. WHAT WE DO OVERVIEW (3 Pillars + Links to Services) */}
      <section className="py-14 sm:py-16 border-b border-slate-200 bg-[#F5F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div>
            <SectionHeading
              title={t('about.whatWeDoTitle')}
              subtitle={t('about.whatWeDoSubtitle')}
              lightMode
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map(({ key, icon: Icon, href }) => (
                <Link
                  key={key}
                  to={href}
                  className="group rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] p-6 text-start space-y-3 transition-colors shadow-xs"
                >
                  <div className="w-11 h-11 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center group-hover:bg-[#FF6A00] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-[#12151A]">
                    {t(`about.pillars.${key}.title`)}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t(`about.pillars.${key}.description`)}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Direct Links to Featured Services */}
          {featuredServices.length > 0 && (
            <div className="space-y-6 text-start pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-bold font-heading text-[#12151A]">
                  {t('home.servicesTitle')}
                </h3>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF6A00] hover:underline"
                >
                  <span>{t('home.viewAllServices')}</span>
                  <ArrowRight className="w-4 h-4 rtl-flip" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredServices.map((srv) => (
                  <Link
                    key={srv.id}
                    to={`/services/${srv.slug}`}
                    className="flex items-center gap-3.5 p-4 rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-[#0E1013] text-[#FF6A00] flex items-center justify-center shrink-0">
                      <ServiceIcon name={srv.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-base text-[#12151A] truncate">
                        {getLocalized(srv, 'name', i18n.language)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {getLocalized(srv, 'short_description', i18n.language)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
