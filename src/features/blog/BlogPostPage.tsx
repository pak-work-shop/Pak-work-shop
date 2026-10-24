import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  User,
  Tag,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShoppingBag,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import { Seo } from '../../components/common/Seo';
import { JsonLd } from '../../components/common/JsonLd';
import { Markdown } from '../../components/common/Markdown';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { useSiteSettings } from '../settings/useSiteSettings';
import type {
  BlogCategoryRow,
  BlogPostRow,
  ProductCategoryRow,
  ServiceRow,
} from '../../types/database';

function calculateReadingTime(text: string): number {
  if (!text) return 3;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [category, setCategory] = useState<BlogCategoryRow | null>(null);
  const [relatedServices, setRelatedServices] = useState<ServiceRow[]>([]);
  const [relatedCategories, setRelatedCategories] = useState<ProductCategoryRow[]>([]);
  const [prevPost, setPrevPost] = useState<{ slug: string; title: BlogPostRow['title'] } | null>(null);
  const [nextPost, setNextPost] = useState<{ slug: string; title: BlogPostRow['title'] } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    async function loadPost() {
      if (!slug || !env.isConfigured) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const { data: currentPost, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .lte('published_at', new Date().toISOString())
          .maybeSingle();

        if (error || !currentPost) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPost(currentPost);

        // Fetch category
        if (currentPost.category_id) {
          const { data: catData } = await supabase
            .from('blog_categories')
            .select('*')
            .eq('id', currentPost.category_id)
            .maybeSingle();
          if (catData) setCategory(catData);
        }

        // Fetch related services
        if (currentPost.related_service_ids && currentPost.related_service_ids.length > 0) {
          const { data: srvData } = await supabase
            .from('services')
            .select('*')
            .in('id', currentPost.related_service_ids)
            .eq('is_active', true);
          if (srvData) setRelatedServices(srvData);
        } else {
          setRelatedServices([]);
        }

        // Fetch related product categories
        if (currentPost.related_category_ids && currentPost.related_category_ids.length > 0) {
          const { data: pcatData } = await supabase
            .from('product_categories')
            .select('*')
            .in('id', currentPost.related_category_ids)
            .eq('is_active', true);
          if (pcatData) setRelatedCategories(pcatData);
        } else {
          setRelatedCategories([]);
        }

        // Fetch prev and next posts
        const [prevRes, nextRes] = await Promise.all([
          supabase
            .from('blog_posts')
            .select('slug, title')
            .eq('is_published', true)
            .lte('published_at', new Date().toISOString())
            .lt('published_at', currentPost.published_at)
            .order('published_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('blog_posts')
            .select('slug, title')
            .eq('is_published', true)
            .lte('published_at', new Date().toISOString())
            .gt('published_at', currentPost.published_at)
            .order('published_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        setPrevPost(prevRes.data || null);
        setNextPost(nextRes.data || null);
      } catch (err) {
        console.error('Failed to load blog post:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    void loadPost();
  }, [slug]);

  const postTitle = useMemo(() => {
    return post ? getLocalized(post.title, i18n.language) : '';
  }, [post, i18n.language]);

  const postExcerpt = useMemo(() => {
    return post ? getLocalized(post.excerpt, i18n.language) : '';
  }, [post, i18n.language]);

  const postContent = useMemo(() => {
    return post ? getLocalized(post.content, i18n.language) : '';
  }, [post, i18n.language]);

  const readingTime = useMemo(() => {
    return calculateReadingTime(postContent);
  }, [postContent]);

  const articleJsonLd = useMemo(() => {
    if (!post) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: postTitle,
      description: postExcerpt,
      image: post.cover_image_url || undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: {
        '@type': 'Organization',
        name: post.author_name || settings.business_name || 'Pak Auto Works',
      },
      publisher: {
        '@type': 'AutoRepair',
        name: settings.business_name || 'Pak Auto Works & Parts',
        logo: {
          '@type': 'ImageObject',
          url: settings.logo_url || `${origin}/favicon.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${origin}/blog/${post.slug}`,
      },
    };
  }, [post, postTitle, postExcerpt, settings]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      void navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const shareText = `${postTitle}\n\nRead full guide on Pak Auto Works:\n${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8] flex items-center justify-center py-20">
        <Spinner size="lg" label={t('common.loading')} />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-[#1B1F26] border border-white/10 rounded-2xl p-8 text-center">
          <BookOpen className="w-12 h-12 text-[#8A93A3] mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold font-heading text-white mb-2">
            {t('blog.notFoundTitle', 'Guide Not Found')}
          </h1>
          <p className="text-sm text-[#8A93A3] mb-6">
            {t(
              'blog.notFoundDesc',
              'The requested guide may have been moved or unpublished. Browse our knowledge center for more articles.'
            )}
          </p>
          <Link to="/blog">
            <Button variant="primary" size="md">
              {t('blog.backToGuides', 'Back to All Guides')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={post.seo_title ? getLocalized(post.seo_title, i18n.language) || postTitle : postTitle}
        description={
          post.seo_description
            ? getLocalized(post.seo_description, i18n.language) || postExcerpt
            : postExcerpt
        }
        canonicalPath={`/blog/${post.slug}`}
        ogImage={post.cover_image_url || undefined}
      />
      {articleJsonLd && <JsonLd data={articleJsonLd} />}

      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/10 bg-[#12151A]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2 text-xs text-[#8A93A3]">
          <Link to="/" className="hover:text-white transition-colors">
            {t('nav.home', 'Home')}
          </Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-white transition-colors">
            {t('nav.blog', 'Guides')}
          </Link>
          {category && (
            <>
              <span>/</span>
              <Link to={`/blog?category=${category.slug}`} className="hover:text-white transition-colors">
                {getLocalized(category.name, i18n.language)}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#F5F6F8] truncate max-w-[200px] sm:max-w-xs">{postTitle}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Post Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {category && (
              <Link
                to={`/blog?category=${category.slug}`}
                className="px-3 py-1 rounded bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-semibold uppercase tracking-wider hover:bg-[#FF6A00]/20 transition-colors"
              >
                {getLocalized(category.name, i18n.language)}
              </Link>
            )}
            {post.is_demo && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                {t('common.sample', 'Sample Guide')}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight leading-tight">
            {postTitle}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#8A93A3] leading-relaxed">
            {postExcerpt}
          </p>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A93A3]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span className="text-[#F5F6F8]">{post.author_name || 'Pak Auto Works Team'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.published_at).toLocaleDateString(
                  i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                  { dateStyle: 'long' }
                )}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} {t('blog.minRead', 'min read')}
              </span>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B1F26] text-[#F5F6F8] hover:bg-[#252B35] border border-white/10 text-xs font-medium transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? t('common.copied', 'Copied!') : t('common.copyLink', 'Copy Link')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Cover Image */}
        {post.cover_image_url && (
          <div className="mb-10 rounded-2xl overflow-hidden border border-white/10 bg-[#12151A] aspect-[16/9]">
            <img
              src={post.cover_image_url}
              alt={postTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-sm">
          <Markdown content={postContent} lightMode={false} className="text-[#F5F6F8]" />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A93A3] mb-3 block">
                {t('blog.tags', 'Tags')}
              </span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?search=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[#8A93A3] bg-[#12151A] hover:text-white hover:border-[#FF6A00]/40 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                  >
                    <Tag className="w-3 h-3 text-[#FF6A00]" />
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Workshop Services */}
        {relatedServices.length > 0 && (
          <div className="mt-12 bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-[#FF6A00]" />
              <h3 className="text-lg font-bold font-heading text-white">
                {t('blog.relatedServices', 'Need This Service for Your Car?')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#8A93A3] mb-6">
              {t(
                'blog.relatedServicesSubtitle',
                'Our Sadiqabad workshop is fully equipped for this work. Book an appointment or check service details:'
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedServices.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-[#12151A] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-[#FF6A00]/40 transition-colors"
                >
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      {getLocalized(srv.name, i18n.language)}
                    </h4>
                    <p className="text-xs text-[#8A93A3] line-clamp-2 mb-3">
                      {getLocalized(srv.short_description, i18n.language)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Link to={`/services/${srv.slug}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        {t('services.viewDetails', 'Details')}
                      </Button>
                    </Link>
                    <Link to={`/book?service=${srv.slug}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        {t('common.bookNow', 'Book Service')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Product Categories */}
        {relatedCategories.length > 0 && (
          <div className="mt-8 bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-[#FFC21A]" />
              <h3 className="text-lg font-bold font-heading text-white">
                {t('blog.relatedParts', 'Shop Related Spare Parts & Accessories')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#8A93A3] mb-6">
              {t(
                'blog.relatedPartsSubtitle',
                '100% genuine guaranteed parts delivered across Pakistan with Cash on Delivery:'
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedCategories.map((pcat) => (
                <Link
                  key={pcat.id}
                  to={`/shop/category/${pcat.slug}`}
                  className="group bg-[#12151A] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-[#FFC21A]/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-white group-hover:text-[#FFC21A] transition-colors">
                    {getLocalized(pcat.name, i18n.language)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#8A93A3] group-hover:text-[#FFC21A] transition-colors rtl:rotate-180" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Previous / Next Post Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevPost ? (
            <Link
              to={`/blog/${prevPost.slug}`}
              className="group bg-[#1B1F26] border border-white/10 rounded-xl p-4 hover:border-[#FF6A00]/40 transition-colors text-start"
            >
              <div className="flex items-center gap-1.5 text-xs text-[#8A93A3] mb-1.5">
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t('blog.prevArticle', 'Previous Guide')}</span>
              </div>
              <h5 className="text-sm font-bold text-white group-hover:text-[#FF6A00] transition-colors line-clamp-1">
                {getLocalized(prevPost.title, i18n.language)}
              </h5>
            </Link>
          ) : (
            <div />
          )}

          {nextPost ? (
            <Link
              to={`/blog/${nextPost.slug}`}
              className="group bg-[#1B1F26] border border-white/10 rounded-xl p-4 hover:border-[#FF6A00]/40 transition-colors text-end"
            >
              <div className="flex items-center justify-end gap-1.5 text-xs text-[#8A93A3] mb-1.5">
                <span>{t('blog.nextArticle', 'Next Guide')}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
              <h5 className="text-sm font-bold text-white group-hover:text-[#FF6A00] transition-colors line-clamp-1">
                {getLocalized(nextPost.title, i18n.language)}
              </h5>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </article>
    </div>
  );
}
