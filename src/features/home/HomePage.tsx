import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Car,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useSiteSettings } from '../settings/useSiteSettings';
import { WEEKDAY_KEYS } from '../settings/SiteSettingsContext';
import { useServices } from '../services/useServices';
import { useFaqs } from '../faq/useFaqs';
import {
  useFeaturedProducts,
  useProductCategories,
} from '../catalogue/useCatalogueData';
import { CategoryIcon } from '../catalogue/CategoryIllustration';
import { getCategoryPhoto } from '../../lib/defaultImages';
import { ProductCard } from '../catalogue/ProductCard';
import { getLocalized } from '../../i18n/helpers';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Accordion, Button, ImageSlot, Skeleton } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { ServiceIcon } from '../../components/common/ServiceIcon';
import { WorkshopIllustration } from '../../components/common/WorkshopIllustration';
import { SectionHeading } from '../../components/common/SectionHeading';
import { JsonLd, buildLocalBusinessJsonLd } from '../../components/common/JsonLd';
import { BeforeAfterSlider } from '../gallery/BeforeAfterSlider';
import type {
  BlogPostRow,
  GalleryItemRow,
  ReviewRow,
  ReviewSummary,
} from '../../types/database';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const { services: featuredServices, loading: loadingServices } = useServices({
    featuredOnly: true,
    limit: 10,
  });
  const { categories: productCategories } = useProductCategories();
  const { products: featuredProducts } = useFeaturedProducts(8);
  const { faqs: teaserFaqs } = useFaqs({ limit: 5 });

  // Phase 8 Trust Content
  const [topReviews, setTopReviews] = useState<ReviewRow[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [latestGuides, setLatestGuides] = useState<BlogPostRow[]>([]);
  const [teaserGallery, setTeaserGallery] = useState<GalleryItemRow[]>([]);

  useEffect(() => {
    async function loadTrustContent() {
      if (!env.isConfigured) return;
      try {
        const [revRes, sumRes, blogRes, galRes] = await Promise.all([
          supabase
            .from('reviews')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(6),
          supabase.rpc('get_review_summary'),
          supabase
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false })
            .limit(3),
          supabase
            .from('gallery_items')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(6),
        ]);

        if (revRes.data) setTopReviews(revRes.data);
        if (sumRes.data) setReviewSummary(sumRes.data as unknown as ReviewSummary);
        if (blogRes.data) setLatestGuides(blogRes.data);
        if (galRes.data) setTeaserGallery(galRes.data);
      } catch (err) {
        console.error('Failed to load trust sections on home:', err);
      }
    }
    void loadTrustContent();
  }, []);

  const topCategories = productCategories
    .filter((c) => !c.parent_id)
    .slice(0, 8);

  const phone = settings.phone || '03126776844';
  const whatsapp = settings.whatsapp || phone;
  const whatsappHref = buildWhatsAppUrl(whatsapp, t('whatsapp.defaultMessage'));

  const heroImageUrl = settings.hero_image_url?.trim() || '';
  const ctaBannerUrl = settings.cta_banner_url?.trim() || '';
  const address = getLocalized(settings, 'address', i18n.language);
  const openDays = WEEKDAY_KEYS.filter(
    (day) => settings.working_hours && settings.working_hours[day]?.isOpen
  );

  const quickActions = [
    {
      key: 'book',
      href: '/book',
      icon: CalendarCheck,
    },
    {
      key: 'shop',
      href: '/shop',
      icon: ShoppingBag,
    },
    {
      key: 'track',
      href: '/track',
      icon: SearchCheck,
    },
    {
      key: 'guidance',
      href: '/blog',
      icon: BookOpen,
    },
  ] as const;

  const benefitKeys = ['one', 'two', 'three', 'four'] as const;
  const stepKeys = ['one', 'two', 'three'] as const;

  const faqAccordionItems = teaserFaqs
    .map((faq) => ({
      id: faq.id,
      question: getLocalized(faq, 'question', i18n.language),
      answer: getLocalized(faq, 'answer', i18n.language),
    }))
    .filter((item) => item.question && item.answer);

  const localBusinessJsonLd = buildLocalBusinessJsonLd(settings, i18n.language);

  return (
    <div>
      <Seo
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
        canonicalPath="/"
      />
      <JsonLd data={localBusinessJsonLd} />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-industrial-grid border-b border-white/10 py-14 sm:py-20 lg:py-24">
        {heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={heroImageUrl}
              alt={settings.business_name || 'Pak Auto Works & Parts'}
              loading="eager"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E1013]/95 via-[#0E1013]/85 to-[#0E1013]/70" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Hero Text Column */}
          <div className="lg:col-span-7 text-start space-y-6">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#FFC21A]">
              <Car className="w-4 h-4 text-[#FF6A00]" />
              <span>{t('home.heroBadge')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-heading text-white leading-tight text-balance">
              {t('home.heroTitle')}
            </h1>

            <p className="text-base sm:text-lg text-[#F5F6F8]/85 max-w-2xl leading-relaxed">
              {t('home.heroSubtitle')}
            </p>

            {/* Three Primary CTAs: Book Service, Shop Parts, Track Job */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/book">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                >
                  {t('home.ctaBook')}
                </Button>
              </Link>

              <Link to="/shop">
                <Button variant="secondary" size="lg">
                  {t('home.ctaShop')}
                </Button>
              </Link>

              <Link to="/track">
                <Button variant="outline" size="lg">
                  {t('home.ctaTrack')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual Column: Custom SVG Illustration when no hero background image is set */}
          <div className="lg:col-span-5">
            {!heroImageUrl && (
              <WorkshopIllustration
                variant="hero-workshop"
                title={t('home.heroImageSlotLabel')}
                aspectRatio="video"
                className="shadow-2xl border-white/20"
              />
            )}
          </div>
        </div>
      </section>

      {/* 2. QUICK ACTION CARDS (Light Content Surface) */}
      <section className="bg-[#F5F6F8] text-[#12151A] py-14 sm:py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title={t('home.quickActionsTitle')}
            subtitle={t('home.quickActionsSubtitle')}
            lightMode
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map(({ key, href, icon: Icon }) => (
              <Link
                key={key}
                to={href}
                className="group rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] p-6 flex flex-col justify-between transition-all duration-150 shadow-xs hover:shadow-md text-start"
              >
                <div>
                  <div className="w-11 h-11 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center mb-4 transition-colors group-hover:bg-[#FF6A00] group-hover:text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-[#12151A] mb-2">
                    {t(`home.quickActions.${key}.title`)}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {t(`home.quickActions.${key}.description`)}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6A00] group-hover:translate-x-0.5 transition-transform">
                  <span>{t(`home.quickActions.${key}.action`)}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES PREVIEW (Database-Driven up to 10 Featured Services) */}
      <section className="bg-white text-[#12151A] py-16 sm:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title={t('home.servicesTitle')}
            subtitle={t('home.servicesSubtitle')}
            lightMode
            actions={
              <Link to="/services">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                >
                  {t('home.viewAllServices')}
                </Button>
              </Link>
            }
          />

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <Skeleton key={idx} className="h-44 w-full bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {featuredServices.map((service) => {
                const name = getLocalized(service, 'name', i18n.language);
                const shortDesc = getLocalized(
                  service,
                  'short_description',
                  i18n.language
                );
                const imgUrl = service.image_url?.trim();

                return (
                  <Link
                    key={service.id}
                    to={`/services/${service.slug}`}
                    className="group rounded-lg bg-[#F5F6F8] hover:bg-[#0E1013] border border-slate-200 hover:border-[#FF6A00] overflow-hidden transition-colors duration-150 text-start flex flex-col justify-between"
                  >
                    {imgUrl ? (
                      <div className="aspect-video w-full overflow-hidden bg-[#1B1F26] border-b border-slate-200 group-hover:border-white/10">
                        <img
                          src={imgUrl}
                          alt={name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <WorkshopIllustration
                        serviceSlug={service.slug}
                        title={name}
                        aspectRatio="video"
                        className="rounded-none border-0 border-b border-slate-200 group-hover:border-white/10"
                      />
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="w-9 h-9 rounded bg-white group-hover:bg-[#1B1F26] border border-slate-200 group-hover:border-white/15 text-[#FF6A00] flex items-center justify-center mb-3">
                          <ServiceIcon name={service.icon} className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-bold font-heading text-[#12151A] group-hover:text-white mb-1.5">
                          {name}
                        </h3>
                        {shortDesc && (
                          <p className="text-xs text-slate-600 group-hover:text-[#8A93A3] leading-relaxed line-clamp-3">
                            {shortDesc}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3B. SHOP PARTS BY CATEGORY & FEATURED PARTS (Phase 5) */}
      {(topCategories.length > 0 || featuredProducts.length > 0) && (
        <section className="bg-[#F5F6F8] text-[#12151A] py-16 sm:py-20 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">
            {topCategories.length > 0 && (
              <div>
                <SectionHeading
                  title={t('home.partsCategoriesTitle')}
                  subtitle={t('home.partsCategoriesSubtitle')}
                  lightMode
                  actions={
                    <Link to="/shop">
                      <Button
                        variant="secondary"
                        size="md"
                        rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                      >
                        {t('home.browseAllParts')}
                      </Button>
                    </Link>
                  }
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {topCategories.map((cat) => {
                    const catName = getLocalized(cat, 'name', i18n.language);
                    const photo = cat.image_url || getCategoryPhoto(cat.slug);
                    return (
                      <Link
                        key={cat.id}
                        to={`/shop/category/${cat.slug}`}
                        className="group rounded-xl bg-white border border-slate-200 hover:border-[#FF6A00] p-3 flex flex-col items-center text-center gap-2 transition-all shadow-xs hover:shadow-md"
                      >
                        <div className="w-14 h-14 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-[#FF6A00]/40 transition-colors">
                          {photo ? (
                            <img
                              src={photo}
                              alt={catName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <CategoryIcon
                              name={cat.icon}
                              slug={cat.slug}
                              className="w-6 h-6 text-[#FF6A00]"
                            />
                          )}
                        </div>
                        <span className="text-xs font-bold font-heading text-[#12151A] group-hover:text-[#FF6A00] line-clamp-2 leading-tight">
                          {catName}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {featuredProducts.length > 0 && (
              <div>
                <SectionHeading
                  title={t('home.featuredPartsTitle')}
                  subtitle={t('home.featuredPartsSubtitle')}
                  lightMode
                  actions={
                    <Link to="/shop">
                      <Button
                        variant="primary"
                        size="md"
                        rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                      >
                        {t('home.browseAllParts')}
                      </Button>
                    </Link>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. WHY CHOOSE US (4 Neutral Benefit Cards on Dark Industrial Surface) */}
      <section className="bg-[#0E1013] text-[#F5F6F8] py-16 sm:py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title={t('home.whyChooseTitle')}
            subtitle={t('home.whyChooseSubtitle')}
            lightMode={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefitKeys.map((key) => (
              <div
                key={key}
                className="rounded-lg bg-[#1B1F26] border border-white/10 p-6 text-start space-y-3"
              >
                <div className="w-9 h-9 rounded bg-[#2A2F38] text-[#FF6A00] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-heading text-white">
                  {t(`home.benefits.${key}.title`)}
                </h3>
                <p className="text-sm text-[#8A93A3] leading-relaxed">
                  {t(`home.benefits.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (3 Steps on Light Surface) */}
      <section className="bg-[#F5F6F8] text-[#12151A] py-16 sm:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title={t('home.howItWorksTitle')}
            subtitle={t('home.howItWorksSubtitle')}
            lightMode
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stepKeys.map((key) => (
              <div
                key={key}
                className="rounded-lg bg-white border border-slate-200 p-6 text-start relative"
              >
                <span className="inline-block text-2xl font-bold font-heading text-[#FF6A00] tabular-nums mb-2">
                  {t(`home.steps.${key}.step`)}.
                </span>
                <h3 className="text-xl font-bold font-heading text-[#12151A] mb-2">
                  {t(`home.steps.${key}.title`)}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t(`home.steps.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5b. TESTIMONIALS / CUSTOMER REVIEWS (Top 6 approved reviews — Hidden if none exist) */}
      {topReviews.length > 0 && (
        <section className="bg-[#12151A] text-[#F5F6F8] py-16 sm:py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              title={t('home.reviewsTitle', 'Trusted by Drivers in Sadiqabad')}
              subtitle={
                reviewSummary && reviewSummary.average_rating > 0
                  ? t('home.reviewsSubtitleAvg', `Rated ${reviewSummary.average_rating.toFixed(1)}/5 by over ${reviewSummary.total_reviews} verified customers across Rahim Yar Khan district.`)
                  : t('home.reviewsSubtitle', 'Real customer ratings and experiences from our workshop and parts store.')
              }
              actions={
                <Link to="/reviews">
                  <Button
                    variant="outline"
                    size="md"
                    className="border-white/20 text-white hover:bg-white/10"
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('home.viewAllReviews', 'View All Reviews')}
                  </Button>
                </Link>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:border-[#FF6A00]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-[#FFC21A]">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= rev.rating ? 'fill-[#FFC21A]' : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      {rev.is_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    {rev.title && (
                      <h4 className="font-bold text-white text-sm mb-1.5 line-clamp-1">
                        {rev.title}
                      </h4>
                    )}

                    <p className="text-xs sm:text-sm text-[#8A93A3] line-clamp-3 leading-relaxed mb-4">
                      "{rev.body}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {rev.reviewer_name}
                    </span>
                    <span className="text-[#8A93A3]">
                      {new Date(rev.created_at).toLocaleDateString(
                        i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                        { dateStyle: 'short' }
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5c. LATEST GUIDES / KNOWLEDGE CENTER (Top 3 published articles — Hidden if none exist) */}
      {latestGuides.length > 0 && (
        <section className="bg-[#1B1F26] text-[#F5F6F8] py-16 sm:py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              title={t('home.guidesTitle', 'Car Maintenance Guides & Tips')}
              subtitle={t(
                'home.guidesSubtitle',
                'Expert advice from our certified mechanics to keep your car healthy, safe, and fuel efficient.'
              )}
              actions={
                <Link to="/blog">
                  <Button
                    variant="outline"
                    size="md"
                    className="border-white/20 text-white hover:bg-white/10"
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('home.viewAllGuides', 'View All Guides')}
                  </Button>
                </Link>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestGuides.map((guide) => (
                <article
                  key={guide.id}
                  className="group bg-[#12151A] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6A00]/50 transition-all flex flex-col justify-between"
                >
                  <Link to={`/blog/${guide.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-[#0E1013]">
                    <img
                      src={
                        guide.cover_image_url ||
                        'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg'
                      }
                      alt={getLocalized(guide.title, i18n.language)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#8A93A3] mb-2">
                        <span>
                          {new Date(guide.published_at).toLocaleDateString(
                            i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                            { dateStyle: 'short' }
                          )}
                        </span>
                        <span>•</span>
                        <span>{guide.author_name || 'Pak Auto Works'}</span>
                      </div>

                      <Link to={`/blog/${guide.slug}`}>
                        <h4 className="text-base font-bold font-heading text-white group-hover:text-[#FF6A00] transition-colors line-clamp-2 leading-snug">
                          {getLocalized(guide.title, i18n.language)}
                        </h4>
                      </Link>

                      <p className="mt-2 text-xs text-[#8A93A3] line-clamp-2 leading-relaxed">
                        {getLocalized(guide.excerpt, i18n.language)}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <Link
                        to={`/blog/${guide.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] group-hover:text-[#FFC21A] transition-colors"
                      >
                        <span>{t('blog.readArticle', 'Read Guide')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5d. GALLERY TEASER (6 images + Before/After preview — Hidden if none exist) */}
      {teaserGallery.length > 0 && (
        <section className="bg-[#0E1013] text-[#F5F6F8] py-16 sm:py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              title={t('home.galleryTitle', 'Workshop Floor & Repair Results')}
              subtitle={t(
                'home.gallerySubtitle',
                'Visual proof of our state-of-the-art diagnostic bays, denting & painting booth, and genuine spare parts.'
              )}
              actions={
                <Link to="/gallery">
                  <Button
                    variant="outline"
                    size="md"
                    className="border-white/20 text-white hover:bg-white/10"
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('home.viewFullGallery', 'View Full Gallery')}
                  </Button>
                </Link>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teaserGallery.map((item) => {
                const title = getLocalized(item.title, i18n.language);
                const isBeforeAfter = item.category === 'before_after' && Boolean(item.before_image_url);

                return (
                  <div
                    key={item.id}
                    className="group bg-[#1B1F26] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6A00]/40 transition-all flex flex-col justify-between"
                  >
                    {isBeforeAfter ? (
                      <BeforeAfterSlider
                        beforeImage={item.before_image_url!}
                        afterImage={item.image_url}
                        beforeAlt={`${title} - Before`}
                        afterAlt={`${title} - After`}
                        aspectRatioClass="aspect-[16/10]"
                      />
                    ) : (
                      <Link to="/gallery" className="block relative aspect-[16/10] overflow-hidden bg-[#12151A]">
                        <img
                          src={item.image_url}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-3 start-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider border border-white/10">
                          {item.category.replace('_', ' ')}
                        </span>
                      </Link>
                    )}

                    <div className="p-4">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#FF6A00] transition-colors line-clamp-1">
                        {title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. FAQ TEASER (4-5 General FAQs in Accordion — Hidden if none exist) */}
      {faqAccordionItems.length > 0 && (
        <section className="bg-white text-[#12151A] py-16 sm:py-20 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeading
              title={t('home.faqTeaserTitle')}
              subtitle={t('home.faqTeaserSubtitle')}
              lightMode
              actions={
                <Link to="/faq">
                  <Button
                    variant="outline"
                    size="md"
                    className="border-slate-300 text-[#12151A] hover:bg-slate-100"
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('home.viewAllFaqs')}
                  </Button>
                </Link>
              }
            />

            <div className="max-w-4xl">
              <Accordion
                items={faqAccordionItems}
                lightMode
                defaultOpenId={faqAccordionItems[0]?.id}
              />
            </div>
          </div>
        </section>
      )}

      {/* 7. CTA BANNER (Uses cta_banner_url when set with dark overlay) */}
      <section className="relative overflow-hidden bg-[#0E1013] border-b border-white/10 py-14 sm:py-16">
        {ctaBannerUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={ctaBannerUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#0E1013]/85" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-start">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-4xl font-bold font-heading text-white">
              {t('home.ctaBannerTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[#8A93A3]">
              {t('home.ctaBannerSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/book">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
              >
                {t('home.ctaBook')}
              </Button>
            </Link>

            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
              >
                {t('nav.whatsappUs')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 8. CONTACT STRIP (Shows Address and Hours ONLY if present in site_settings) */}
      <section className="bg-[#1B1F26] text-[#F5F6F8] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-lg bg-[#0E1013] border border-white/15 p-6 sm:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="text-start space-y-2 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                  {t('home.contactStripTitle')}
                </h2>
                <p className="text-sm text-[#8A93A3]">{t('home.contactStripSubtitle')}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a href={`tel:${phone}`}>
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Phone className="w-4 h-4" />}
                  >
                    <span dir="ltr" className="tabular-nums">
                      {phone}
                    </span>
                  </Button>
                </a>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
                  >
                    {t('nav.whatsappUs')}
                  </Button>
                </a>
              </div>
            </div>

            {/* Conditionally render Address and Working Hours only when set in site_settings */}
            {(address || openDays.length > 0) && (
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
                {address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-semibold text-[#8A93A3] mb-1">
                        {t('home.addressLabel')}
                      </h3>
                      <p className="text-sm text-white">{address}</p>
                    </div>
                  </div>
                )}

                {openDays.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
                    <div className="w-full">
                      <h3 className="text-xs font-semibold text-[#8A93A3] mb-2">
                        {t('home.hoursLabel')}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        {openDays.map((day) => {
                          const entry = settings.working_hours[day];
                          if (!entry) return null;
                          return (
                            <div
                              key={day}
                              className="flex items-center justify-between gap-2 py-0.5"
                            >
                              <span className="text-[#8A93A3]">
                                {t(`admin.settings.weekdays.${day}`)}
                              </span>
                              <span dir="ltr" className="text-white tabular-nums font-medium">
                                {entry.openTime} – {entry.closeTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
