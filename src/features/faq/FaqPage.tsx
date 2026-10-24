import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, X } from 'lucide-react';
import { useFaqs } from './useFaqs';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { Accordion, Button, EmptyState, Skeleton } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { JsonLd, buildFaqPageJsonLd } from '../../components/common/JsonLd';
import { cn } from '../../lib/utils';
import type { FaqCategory } from '../../types/database';

const CATEGORY_KEYS: ReadonlyArray<FaqCategory | 'all'> = [
  'all',
  'general',
  'services',
  'booking',
  'parts',
  'delivery',
  'payments',
];

export default function FaqPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const { faqs, loading, error, reload } = useFaqs();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const whatsapp = settings.whatsapp || settings.phone || '03126776844';
  const whatsappHref = buildWhatsAppUrl(whatsapp, t('whatsapp.defaultMessage'));

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      if (selectedCategory !== 'all' && faq.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const questionText = getLocalized(faq, 'question', i18n.language).toLowerCase();
      const answerText = getLocalized(faq, 'answer', i18n.language).toLowerCase();
      return questionText.includes(q) || answerText.includes(q);
    });
  }, [faqs, selectedCategory, searchQuery, i18n.language]);

  const accordionItems = useMemo(
    () =>
      filteredFaqs
        .map((faq) => ({
          id: faq.id,
          question: getLocalized(faq, 'question', i18n.language),
          answer: getLocalized(faq, 'answer', i18n.language),
          badge: t(`faq.categories.${faq.category}`),
        }))
        .filter((item) => item.question && item.answer),
    [filteredFaqs, i18n.language, t]
  );

  const faqJsonLd = useMemo(
    () => buildFaqPageJsonLd(faqs, i18n.language),
    [faqs, i18n.language]
  );

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo
        title={t('faq.seoTitle')}
        description={t('faq.seoDescription')}
        canonicalPath="/faq"
      />
      <JsonLd data={faqJsonLd} />

      <PageHeader
        title={t('faq.pageTitle')}
        subtitle={t('faq.pageSubtitle')}
        breadcrumbs={[{ label: t('nav.faq') }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Search Input + Category Filter Chips */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('faq.searchPlaceholder')}
              aria-label={t('faq.searchPlaceholder')}
              className="w-full rounded-md ps-10 pe-9 py-2.5 text-sm bg-[#F5F6F8] text-[#12151A] placeholder:text-slate-400 border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('common.close')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="FAQ Categories"
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            {CATEGORY_KEYS.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
                    isSelected
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-[#F5F6F8] text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {t(`faq.categories.${cat}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full bg-slate-200" />
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
        ) : accordionItems.length === 0 ? (
          <EmptyState
            title={t('faq.emptyTitle')}
            description={t('faq.emptyDescription')}
            className="bg-white border-slate-200 text-[#12151A]"
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                {t('services.clearSearch')}
              </Button>
            }
          />
        ) : (
          <Accordion
            items={accordionItems}
            lightMode
            defaultOpenId={accordionItems[0]?.id}
          />
        )}

        {/* Still Have Questions Strip */}
        <div className="rounded-lg bg-[#0E1013] text-[#F5F6F8] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-start">
          <div>
            <h2 className="text-xl font-bold font-heading text-white">
              {t('faq.stillHaveQuestions')}
            </h2>
            <p className="text-sm text-[#8A93A3] mt-1">
              {t('faq.stillHaveQuestionsSub')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button
                variant="primary"
                leftIcon={<MessageCircle className="w-4 h-4" />}
              >
                {t('nav.whatsappUs')}
              </Button>
            </a>
            <Link to="/contact">
              <Button variant="secondary">{t('nav.contact')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
