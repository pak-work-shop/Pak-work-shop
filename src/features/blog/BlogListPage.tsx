import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, Clock, Search, Tag, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import { Seo } from '../../components/common/Seo';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import type { BlogCategoryRow, BlogPostRow } from '../../types/database';

function calculateReadingTime(text: string): number {
  if (!text) return 3;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

const PAGE_SIZE = 9;

export default function BlogListPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get('category') || 'all';

  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    async function loadBlogData() {
      if (!env.isConfigured) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [catRes, postRes] = await Promise.all([
          supabase
            .from('blog_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .lte('published_at', new Date().toISOString())
            .order('published_at', { ascending: false }),
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (postRes.data) setPosts(postRes.data);
      } catch (err) {
        console.error('Failed to load blog guides:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadBlogData();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, BlogCategoryRow>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const categorySlugToId = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.slug, cat.id));
    return map;
  }, [categories]);

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (selectedCategorySlug !== 'all') {
      const catId = categorySlugToId.get(selectedCategorySlug);
      if (catId) {
        result = result.filter((p) => p.category_id === catId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const title = getLocalized(p.title, i18n.language).toLowerCase();
        const excerpt = getLocalized(p.excerpt, i18n.language).toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        return title.includes(q) || excerpt.includes(q) || tags.includes(q);
      });
    }

    return result;
  }, [posts, selectedCategorySlug, categorySlugToId, searchQuery, i18n.language]);

  const featuredPost = useMemo(() => {
    return filteredPosts.length > 0 ? filteredPosts[0] : null;
  }, [filteredPosts]);

  const gridPosts = useMemo(() => {
    return filteredPosts.length > 1 ? filteredPosts.slice(1, visibleCount + 1) : [];
  }, [filteredPosts, visibleCount]);

  const hasMore = filteredPosts.length > visibleCount + 1;

  const handleSelectCategory = (slug: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', slug);
    }
    setSearchParams(nextParams);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={t('blog.pageTitle', 'Car Knowledge Center & Maintenance Guides')}
        description={t(
          'blog.pageDescription',
          'Expert automotive maintenance tips, repair advice, and spare parts buying guides from Pak Auto Works technicians in Sadiqabad.'
        )}
        canonicalPath="/blog"
      />

      {/* Header Banner */}
      <section className="relative py-14 sm:py-20 border-b border-white/10 bg-gradient-to-b from-[#1B1F26] to-[#0E1013]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-semibold uppercase tracking-wider mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('blog.badge', 'Car Knowledge Center')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
              {t('blog.heading', 'Guides, Maintenance Tips & Auto Insights')}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#8A93A3] leading-relaxed">
              {t(
                'blog.subtitle',
                'Practical advice from our master mechanics in Sadiqabad to keep your vehicle reliable, fuel-efficient, and road-ready in Pakistani conditions.'
              )}
            </p>
          </div>

          {/* Search Bar & Categories */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A93A3] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder={t('blog.searchPlaceholder', 'Search guides by topic, car model, or parts...')}
                className="w-full bg-[#12151A] border border-white/10 rounded-lg ps-10 pe-4 py-2.5 text-sm text-white placeholder-[#8A93A3] focus:outline-none focus:border-[#FF6A00] focus:ring-1 focus:ring-[#FF6A00] transition-colors"
              />
            </div>

            {/* Quick Tools CTA */}
            <div className="flex items-center gap-2">
              <Link to="/tools/cost-estimator">
                <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-4 h-4 text-[#FF6A00]" />}>
                  {t('blog.tryEstimator', 'Cost Estimator')}
                </Button>
              </Link>
              <Link to="/tools/next-service">
                <Button variant="secondary" size="sm" leftIcon={<Clock className="w-4 h-4 text-[#FFC21A]" />}>
                  {t('blog.nextService', 'Service Calculator')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Chips */}
          <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategorySlug === 'all'
                  ? 'bg-[#FF6A00] text-white shadow-sm'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white hover:bg-[#252B35] border border-white/10'
              }`}
            >
              {t('common.all', 'All Guides')} ({posts.length})
            </button>
            {categories.map((cat) => {
              const catPostCount = posts.filter((p) => p.category_id === cat.id).length;
              const isSelected = selectedCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[#FF6A00] text-white shadow-sm'
                      : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white hover:bg-[#252B35] border border-white/10'
                  }`}
                >
                  {getLocalized(cat.name, i18n.language)} ({catPostCount})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" label={t('common.loading')} />
            <p className="text-sm text-[#8A93A3]">{t('blog.loadingGuides', 'Loading guides...')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center bg-[#1B1F26] border border-white/10 rounded-xl p-8 max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-[#8A93A3] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white mb-1">
              {t('blog.noResultsTitle', 'No guides found')}
            </h3>
            <p className="text-sm text-[#8A93A3] mb-5">
              {searchQuery
                ? t('blog.noSearchMatch', 'Try searching with different keywords or reset the category filter.')
                : t('blog.emptyCategory', 'No articles published in this category yet. Check back soon!')}
            </p>
            {(searchQuery || selectedCategorySlug !== 'all') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory('all');
                }}
              >
                {t('common.resetFilters', 'Reset Filters')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Post Card (Hero) */}
            {featuredPost && (
              <div className="relative group bg-[#1B1F26] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6A00]/40 transition-all shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-[#12151A]">
                    <img
                      src={
                        featuredPost.cover_image_url ||
                        'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg'
                      }
                      alt={getLocalized(featuredPost.title, i18n.language)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B1F26] via-transparent to-transparent lg:hidden" />
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded bg-[#FF6A00] text-white text-[11px] font-bold uppercase tracking-wide">
                          {t('blog.featured', 'Featured Guide')}
                        </span>
                        {featuredPost.category_id && categoryMap.get(featuredPost.category_id) && (
                          <span className="px-2.5 py-1 rounded bg-white/10 text-[#F5F6F8] text-[11px] font-medium">
                            {getLocalized(categoryMap.get(featuredPost.category_id)?.name, i18n.language)}
                          </span>
                        )}
                        {featuredPost.is_demo && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                            {t('common.sample', 'Sample')}
                          </span>
                        )}
                      </div>

                      <Link to={`/blog/${featuredPost.slug}`}>
                        <h2 className="text-xl sm:text-2xl font-bold font-heading text-white group-hover:text-[#FF6A00] transition-colors leading-snug">
                          {getLocalized(featuredPost.title, i18n.language)}
                        </h2>
                      </Link>

                      <p className="mt-3 text-sm text-[#8A93A3] line-clamp-3 leading-relaxed">
                        {getLocalized(featuredPost.excerpt, i18n.language)}
                      </p>

                      {featuredPost.tags && featuredPost.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {featuredPost.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[11px] text-[#8A93A3] bg-[#12151A] px-2 py-0.5 rounded border border-white/5"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-[#8A93A3]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featuredPost.published_at).toLocaleDateString(
                            i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                            { dateStyle: 'medium' }
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {calculateReadingTime(getLocalized(featuredPost.content, i18n.language))} {t('blog.minRead', 'min read')}
                        </span>
                      </div>

                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] hover:text-[#FFC21A] transition-colors"
                      >
                        <span>{t('blog.readArticle', 'Read Guide')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Post Grid */}
            {gridPosts.length > 0 && (
              <div>
                <h3 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-2">
                  <span>{t('blog.moreArticles', 'More Useful Guides')}</span>
                  <span className="text-xs font-normal text-[#8A93A3]">
                    ({filteredPosts.length - 1} {t('blog.articlesCount', 'articles')})
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPosts.map((post) => {
                    const postCat = post.category_id ? categoryMap.get(post.category_id) : null;
                    const readingTime = calculateReadingTime(getLocalized(post.content, i18n.language));

                    return (
                      <article
                        key={post.id}
                        className="group flex flex-col bg-[#1B1F26] border border-white/10 rounded-xl overflow-hidden hover:border-[#FF6A00]/40 transition-all shadow-sm hover:shadow-md"
                      >
                        <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-[#12151A]">
                          <img
                            src={
                              post.cover_image_url ||
                              'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg'
                            }
                            alt={getLocalized(post.title, i18n.language)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {postCat && (
                            <span className="absolute top-3 start-3 px-2 py-0.5 rounded bg-[#12151A]/80 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/10">
                              {getLocalized(postCat.name, i18n.language)}
                            </span>
                          )}
                        </Link>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-[#8A93A3] mb-2.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(post.published_at).toLocaleDateString(
                                  i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                                  { dateStyle: 'short' }
                                )}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {readingTime} {t('blog.minRead', 'min read')}
                              </span>
                            </div>

                            <Link to={`/blog/${post.slug}`}>
                              <h4 className="text-base font-bold font-heading text-white group-hover:text-[#FF6A00] transition-colors line-clamp-2 leading-snug">
                                {getLocalized(post.title, i18n.language)}
                              </h4>
                            </Link>

                            <p className="mt-2 text-xs text-[#8A93A3] line-clamp-2 leading-relaxed">
                              {getLocalized(post.excerpt, i18n.language)}
                            </p>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[11px] text-[#8A93A3]">
                              {post.author_name || 'Pak Auto Works'}
                            </span>
                            <Link
                              to={`/blog/${post.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6A00] group-hover:text-[#FFC21A] transition-colors"
                            >
                              <span>{t('blog.readMore', 'Read')}</span>
                              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  {t('blog.loadMore', 'Load More Guides')}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
