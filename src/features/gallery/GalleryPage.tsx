import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Image as ImageIcon,
  Layers,
  Wrench,
  Users,
  Package,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import { Seo } from '../../components/common/Seo';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import type { GalleryCategory, GalleryItemRow } from '../../types/database';

const CATEGORIES: Array<{
  id: GalleryCategory | 'all';
  labelEn: string;
  labelUr: string;
  labelUrRoman: string;
}> = [
  { id: 'all', labelEn: 'All Work', labelUr: 'تمام تصاویر', labelUrRoman: 'Tamam Tasaveer' },
  { id: 'workshop', labelEn: 'Workshop Facility', labelUr: 'ورکشاپ کی سہولیات', labelUrRoman: 'Workshop Facility' },
  { id: 'repairs', labelEn: 'Mechanical Repairs', labelUr: 'مرمت و کام', labelUrRoman: 'Mechanical Repairs' },
  { id: 'before_after', labelEn: 'Before & After', labelUr: 'پہلے اور بعد میں', labelUrRoman: 'Pehle Aur Baad Mein' },
  { id: 'parts', labelEn: 'Parts & Lubricants', labelUr: 'اسپیئر پارٹس اسٹاک', labelUrRoman: 'Spare Parts Stock' },
  { id: 'team', labelEn: 'Our Technicians', labelUr: 'ہماری ٹیکنیشن ٹیم', labelUrRoman: 'Hamari Team' },
];

export default function GalleryPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = (searchParams.get('category') as GalleryCategory | 'all') || 'all';

  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadGallery() {
      if (!env.isConfigured) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        if (data) setItems(data);
      } catch (err) {
        console.error('Failed to load gallery items:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadGallery();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  const handleSelectCategory = (catId: GalleryCategory | 'all') => {
    const nextParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catId);
    }
    setSearchParams(nextParams);
    setLightboxIndex(null);
  };

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const prevItem = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredItems.length - 1));
  }, [lightboxIndex, filteredItems.length]);

  const nextItem = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! < filteredItems.length - 1 ? prev! + 1 : 0));
  }, [lightboxIndex, filteredItems.length]);

  // Keyboard handlers for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevItem();
      } else if (e.key === 'ArrowRight') {
        nextItem();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, prevItem, nextItem]);

  const currentLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={t('gallery.pageTitle', 'Workshop & Work Gallery')}
        description={t(
          'gallery.pageDescription',
          'Explore our workshop facility, before/after body repair comparisons, high-tech engine overhauls, and genuine parts inventory in Sadiqabad.'
        )}
        canonicalPath="/gallery"
      />

      {/* Header Banner */}
      <section className="relative py-14 sm:py-18 border-b border-white/10 bg-gradient-to-b from-[#1B1F26] to-[#0E1013]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-semibold uppercase tracking-wider">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{t('gallery.badge', 'Visual Proof of Work')}</span>
              </div>
              {settings.demo_mode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                  {t('gallery.sampleImagesNote', 'Sample images')}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
              {t('gallery.heading', 'Workshop Floor, Repairs & Transformations')}
            </h1>
            <p className="mt-3 text-base text-[#8A93A3] leading-relaxed">
              {t(
                'gallery.subtitle',
                'Take a virtual tour of our diagnostic bays, denting/painting results, genuine parts storage, and certified mechanics in Sadiqabad.'
              )}
            </p>
          </div>

          {/* Category Chips */}
          <div className="mt-8 flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {CATEGORIES.map((cat) => {
              const count = cat.id === 'all' ? items.length : items.filter((i) => i.category === cat.id).length;
              const isSelected = activeCategory === cat.id;
              const label =
                i18n.language === 'ur'
                  ? cat.labelUr
                  : i18n.language === 'ur-roman'
                  ? cat.labelUrRoman
                  : cat.labelEn;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#FF6A00] text-white shadow-sm'
                      : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white hover:bg-[#252B35] border border-white/10'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" label={t('common.loading')} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-[#1B1F26] border border-white/10 rounded-2xl p-8 max-w-lg mx-auto">
            <ImageIcon className="w-12 h-12 text-[#8A93A3] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-white mb-1">
              {t('gallery.emptyCategory', 'No photos in this category yet')}
            </h3>
            <p className="text-xs text-[#8A93A3] mb-4">
              {t('gallery.emptyCategoryDesc', 'Switch to another category or view all gallery pictures.')}
            </p>
            <Button variant="secondary" size="sm" onClick={() => handleSelectCategory('all')}>
              {t('common.viewAll', 'View All Photos')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => {
              const title = getLocalized(item.title, i18n.language);
              const caption = getLocalized(item.caption, i18n.language);
              const isBeforeAfter = item.category === 'before_after' && Boolean(item.before_image_url);

              return (
                <div
                  key={item.id}
                  className="group bg-[#1B1F26] border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-[#FF6A00]/40 transition-all flex flex-col"
                >
                  {/* Photo area */}
                  {isBeforeAfter ? (
                    <div className="relative">
                      <BeforeAfterSlider
                        beforeImage={item.before_image_url!}
                        afterImage={item.image_url}
                        beforeAlt={`${title} - Before`}
                        afterAlt={`${title} - After`}
                        aspectRatioClass="aspect-[16/10]"
                      />
                      <button
                        type="button"
                        onClick={() => openLightbox(idx)}
                        aria-label="Expand image"
                        className="absolute bottom-3 end-3 p-2 rounded-lg bg-black/70 backdrop-blur-sm text-white hover:bg-[#FF6A00] transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => openLightbox(idx)}
                      className="relative aspect-[16/10] overflow-hidden bg-[#12151A] cursor-pointer"
                    >
                      <img
                        src={item.image_url}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2.5 rounded-full bg-black/60 backdrop-blur-sm text-white">
                          <Maximize2 className="w-4 h-4" />
                        </span>
                      </div>
                      <span className="absolute top-3 start-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/10 uppercase">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Caption area */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#FF6A00] transition-colors mb-1.5">
                        {title}
                      </h3>
                      {caption && (
                        <p className="text-xs text-[#8A93A3] line-clamp-2 leading-relaxed">
                          {caption}
                        </p>
                      )}
                    </div>
                    {item.is_demo && (
                      <div className="mt-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                          {t('common.sample', 'Sample Image')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA to Book Workshop */}
        <div className="mt-16 bg-[#161A20] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
          <div>
            <h3 className="text-xl font-bold font-heading text-white mb-1.5">
              {t('gallery.ctaTitle', 'Like What You See? Book Your Vehicle In Sadiqabad')}
            </h3>
            <p className="text-sm text-[#8A93A3]">
              {t(
                'gallery.ctaDesc',
                'Experience professional workmanship with guaranteed genuine parts and transparent pricing.'
              )}
            </p>
          </div>
          <Link to="/book">
            <Button variant="primary" size="lg">
              {t('common.bookAppointment', 'Book Appointment')}
            </Button>
          </Link>
        </div>
      </main>

      {/* Accessible Full-screen Lightbox Modal */}
      {currentLightboxItem && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white max-w-5xl">
            <div className="text-xs sm:text-sm font-semibold text-[#8A93A3]">
              <span>{lightboxIndex + 1}</span> / <span>{filteredItems.length}</span>
            </div>
            <button
              type="button"
              onClick={closeLightbox}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Visual Center */}
          <div className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center my-auto">
            {/* Prev button */}
            <button
              type="button"
              onClick={prevItem}
              className="absolute -start-2 sm:-start-14 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-[#FF6A00] transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
            </button>

            {/* Content (Slider or Image) */}
            <div className="w-full max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl">
              {currentLightboxItem.category === 'before_after' && currentLightboxItem.before_image_url ? (
                <div className="w-full max-w-3xl">
                  <BeforeAfterSlider
                    beforeImage={currentLightboxItem.before_image_url}
                    afterImage={currentLightboxItem.image_url}
                    aspectRatioClass="aspect-[16/10]"
                  />
                </div>
              ) : (
                <img
                  src={currentLightboxItem.image_url}
                  alt={getLocalized(currentLightboxItem.title, i18n.language)}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={nextItem}
              className="absolute -end-2 sm:-end-14 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-[#FF6A00] transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 rtl:rotate-180" />
            </button>
          </div>

          {/* Caption & Title Footer */}
          <div className="w-full max-w-3xl text-center py-2">
            <h4 className="text-lg font-bold text-white mb-1">
              {getLocalized(currentLightboxItem.title, i18n.language)}
            </h4>
            <p className="text-xs text-[#8A93A3] line-clamp-2">
              {getLocalized(currentLightboxItem.caption, i18n.language)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
