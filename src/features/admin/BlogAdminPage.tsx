import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit2,
  FolderTree,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  Eye,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized, SUPPORTED_LANGUAGES } from '../../i18n/helpers';
import { TranslatableField } from '../../components/common/TranslatableField';
import { ImageField } from '../../components/common/ImageField';
import { Markdown } from '../../components/common/Markdown';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import type {
  BlogCategoryRow,
  BlogPostRow,
  LanguageCode,
  LocalizedText,
  ProductCategoryRow,
  ServiceRow,
} from '../../types/database';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function calculateReadingTime(text: string): number {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 180));
}

const EMPTY_LOCALIZED: LocalizedText = { en: '', ur: '', 'ur-roman': '' };

export default function BlogAdminPage() {
  const { t, i18n } = useTranslation();

  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [categories, setCategories] = useState<BlogCategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

  // Category Modal
  const [editingCategory, setEditingCategory] = useState<BlogCategoryRow | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

  // Form Fields for Post
  const [formSlug, setFormSlug] = useState<string>('');
  const [formTitle, setFormTitle] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [formExcerpt, setFormExcerpt] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [formContent, setFormContent] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [formCoverImage, setFormCoverImage] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formTagsString, setFormTagsString] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('Pak Auto Works Team');
  const [formIsPublished, setFormIsPublished] = useState<boolean>(false);
  const [formPublishedAt, setFormPublishedAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [formRelatedServiceIds, setFormRelatedServiceIds] = useState<string[]>([]);
  const [formRelatedCategoryIds, setFormRelatedCategoryIds] = useState<string[]>([]);
  const [formSeoTitle, setFormSeoTitle] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [formSeoDescription, setFormSeoDescription] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [contentLangTab, setContentLangTab] = useState<LanguageCode>('en');
  const [previewMarkdown, setPreviewMarkdown] = useState<boolean>(false);
  const [savingPost, setSavingPost] = useState<boolean>(false);

  // Form Fields for Category
  const [catSlug, setCatSlug] = useState<string>('');
  const [catName, setCatName] = useState<LocalizedText>(EMPTY_LOCALIZED);
  const [catSortOrder, setCatSortOrder] = useState<number>(0);
  const [catIsActive, setCatIsActive] = useState<boolean>(true);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  const fetchAllData = async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [postRes, catRes, srvRes, pcatRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('*')
          .order('published_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      if (postRes.data) setPosts(postRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (srvRes.data) setServices(srvRes.data);
      if (pcatRes.data) setProductCategories(pcatRes.data);
    } catch (err) {
      console.error('Failed to load admin blog data:', err);
      toast.error('Failed to load blog records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
  }, []);

  const openCreatePost = () => {
    setEditingPost(null);
    setFormSlug('');
    setFormTitle({ en: '', ur: '', 'ur-roman': '' });
    setFormExcerpt({ en: '', ur: '', 'ur-roman': '' });
    setFormContent({ en: '', ur: '', 'ur-roman': '' });
    setFormCoverImage('');
    setFormCategoryId(categories[0]?.id || '');
    setFormTagsString('');
    setFormAuthor('Pak Auto Works Team');
    setFormIsPublished(false);
    setFormPublishedAt(new Date().toISOString().slice(0, 16));
    setFormRelatedServiceIds([]);
    setFormRelatedCategoryIds([]);
    setFormSeoTitle({ en: '', ur: '', 'ur-roman': '' });
    setFormSeoDescription({ en: '', ur: '', 'ur-roman': '' });
    setContentLangTab('en');
    setPreviewMarkdown(false);
    setIsCreatingPost(true);
  };

  const openEditPost = (post: BlogPostRow) => {
    setEditingPost(post);
    setFormSlug(post.slug);
    setFormTitle(post.title || { en: '', ur: '', 'ur-roman': '' });
    setFormExcerpt(post.excerpt || { en: '', ur: '', 'ur-roman': '' });
    setFormContent(post.content || { en: '', ur: '', 'ur-roman': '' });
    setFormCoverImage(post.cover_image_url || '');
    setFormCategoryId(post.category_id || '');
    setFormTagsString((post.tags || []).join(', '));
    setFormAuthor(post.author_name || 'Pak Auto Works Team');
    setFormIsPublished(post.is_published);
    setFormPublishedAt(
      post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    );
    setFormRelatedServiceIds(post.related_service_ids || []);
    setFormRelatedCategoryIds(post.related_category_ids || []);
    setFormSeoTitle(post.seo_title || { en: '', ur: '', 'ur-roman': '' });
    setFormSeoDescription(post.seo_description || { en: '', ur: '', 'ur-roman': '' });
    setContentLangTab('en');
    setPreviewMarkdown(false);
    setIsCreatingPost(true);
  };

  // Auto slug generation from English title
  const handleTitleChange = (nextTitle: LocalizedText) => {
    setFormTitle(nextTitle);
    if (!editingPost && nextTitle.en && !formSlug) {
      setFormSlug(slugify(nextTitle.en));
    }
  };

  // Duplicate Post
  const handleDuplicatePost = async (post: BlogPostRow) => {
    try {
      const newSlug = `${post.slug}-copy-${Math.floor(Math.random() * 1000)}`;
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          slug: newSlug,
          title: {
            ...post.title,
            en: `${post.title.en || ''} (Copy)`,
          },
          excerpt: post.excerpt,
          content: post.content,
          cover_image_url: post.cover_image_url,
          category_id: post.category_id,
          tags: post.tags,
          author_name: post.author_name,
          is_published: false,
          published_at: new Date().toISOString(),
          related_service_ids: post.related_service_ids,
          related_category_ids: post.related_category_ids,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          is_demo: false,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Post duplicated as draft');
      void fetchAllData();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to duplicate post');
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
      if (error) throw error;
      toast.success('Post deleted successfully');
      setDeleteConfirmPostId(null);
      void fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete post');
    }
  };

  // Save Post
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlug.trim()) {
      toast.error('Please enter a valid slug');
      return;
    }
    if (!formTitle.en?.trim()) {
      toast.error('English title is required');
      return;
    }

    setSavingPost(true);
    try {
      const tagsArray = formTagsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        slug: slugify(formSlug),
        title: formTitle,
        excerpt: formExcerpt,
        content: formContent,
        cover_image_url: formCoverImage.trim() || null,
        category_id: formCategoryId || null,
        tags: tagsArray,
        author_name: formAuthor.trim() || 'Pak Auto Works Team',
        is_published: formIsPublished,
        published_at: new Date(formPublishedAt).toISOString(),
        related_service_ids: formRelatedServiceIds,
        related_category_ids: formRelatedCategoryIds,
        seo_title: formSeoTitle,
        seo_description: formSeoDescription,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', editingPost.id);
        if (error) throw error;
        toast.success('Guide updated successfully');
      } else {
        const { error } = await supabase.from('blog_posts').insert({
          ...payload,
          is_demo: false,
        });
        if (error) throw error;
        toast.success('Guide created successfully');
      }

      setIsCreatingPost(false);
      void fetchAllData();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to save guide';
      toast.error(msg);
    } finally {
      setSavingPost(false);
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catSlug.trim()) {
      toast.error('Category slug is required');
      return;
    }
    if (!catName.en?.trim()) {
      toast.error('English category name is required');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        slug: slugify(catSlug),
        name: catName,
        sort_order: catSortOrder,
        is_active: catIsActive,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('blog_categories').insert(payload);
        if (error) throw error;
        toast.success('Category created');
      }

      setIsCreatingCategory(false);
      void fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const { error } = await supabase.from('blog_categories').delete().eq('id', catId);
      if (error) throw error;
      toast.success('Category deleted');
      void fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  // Filtered Posts List
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter === 'published' && !p.is_published) return false;
      if (statusFilter === 'draft' && p.is_published) return false;
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (p.title.en || '').toLowerCase();
        const slug = p.slug.toLowerCase();
        return title.includes(q) || slug.includes(q);
      }
      return true;
    });
  }, [posts, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">
            {t('admin.blog.title', 'Car Knowledge Center & Blog Guides')}
          </h1>
          <p className="text-xs sm:text-sm text-[#8A93A3]">
            {t('admin.blog.subtitle', 'Publish repair tutorials, maintenance checklists, and spare parts advice.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'categories' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab(activeTab === 'categories' ? 'posts' : 'categories')}
            leftIcon={<FolderTree className="w-4 h-4" />}
          >
            {activeTab === 'categories' ? 'View Articles' : 'Manage Categories'}
          </Button>

          {activeTab === 'posts' && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreatePost}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('admin.blog.newPost', 'New Article')}
            </Button>
          )}

          {activeTab === 'categories' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingCategory(null);
                setCatSlug('');
                setCatName({ en: '', ur: '', 'ur-roman': '' });
                setCatSortOrder(categories.length + 1);
                setCatIsActive(true);
                setIsCreatingCategory(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Category
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs View */}
      {activeTab === 'categories' ? (
        /* CATEGORIES CRUD TABLE */
        <div className="bg-[#1B1F26] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Blog Categories ({categories.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#12151A] text-[#8A93A3] border-b border-white/10 uppercase font-semibold">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Name (EN)</th>
                  <th className="p-3">Name (UR)</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono text-[#8A93A3]">{c.sort_order}</td>
                    <td className="p-3 font-bold text-white">{c.name.en}</td>
                    <td className="p-3 text-[#F5F6F8]">{c.name.ur || '—'}</td>
                    <td className="p-3 font-mono text-[#FF6A00]">{c.slug}</td>
                    <td className="p-3">
                      {c.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#8A93A3] font-semibold text-[10px]">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(c);
                          setCatSlug(c.slug);
                          setCatName(c.name);
                          setCatSortOrder(c.sort_order);
                          setCatIsActive(c.is_active);
                          setIsCreatingCategory(true);
                        }}
                        className="text-[#8A93A3] hover:text-white"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ARTICLES POSTS VIEW */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1B1F26] border border-white/10 p-3 rounded-xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title or slug..."
                className="w-full bg-[#12151A] border border-white/10 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="bg-[#12151A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#12151A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center text-[#8A93A3] text-sm">
                No articles match your query. Click "New Article" to write one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#12151A] text-[#8A93A3] border-b border-white/10 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Cover</th>
                      <th className="p-3">Article Title & Slug</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Published Date</th>
                      <th className="p-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPosts.map((post) => {
                      const cat = categories.find((c) => c.id === post.category_id);
                      return (
                        <tr key={post.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 w-16">
                            <div className="w-14 h-10 rounded bg-[#12151A] overflow-hidden border border-white/10 shrink-0">
                              {post.cover_image_url ? (
                                <img
                                  src={post.cover_image_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BookOpen className="w-4 h-4 text-[#8A93A3] m-auto mt-3 opacity-50" />
                              )}
                            </div>
                          </td>

                          <td className="p-3 max-w-sm">
                            <div className="font-bold text-white text-sm line-clamp-1">
                              {post.title.en || 'Untitled'}
                            </div>
                            <div className="text-[11px] font-mono text-[#8A93A3]">
                              /blog/{post.slug}
                            </div>
                            {post.is_demo && (
                              <span className="text-[10px] text-amber-400 font-medium">
                                (Sample Post)
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[#F5F6F8] border border-white/10 text-[11px]">
                              {cat?.name.en || 'Uncategorized'}
                            </span>
                          </td>

                          <td className="p-3">
                            {post.is_published ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                                <Check className="w-3 h-3" />
                                Published
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#8A93A3] font-semibold text-[10px]">
                                Draft
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-[#8A93A3]">
                            {new Date(post.published_at).toLocaleDateString()}
                          </td>

                          <td className="p-3 text-end space-x-1 shrink-0">
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-white/5 text-[#8A93A3] hover:text-white inline-block"
                              title="View Public Post"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDuplicatePost(post)}
                              className="p-1.5 rounded bg-white/5 text-[#8A93A3] hover:text-white inline-block"
                              title="Duplicate Post"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditPost(post)}
                              className="p-1.5 rounded bg-white/5 text-[#8A93A3] hover:text-white inline-block"
                              title="Edit Post"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmPostId(post.id)}
                              className="p-1.5 rounded bg-red-500/10 text-red-400 hover:text-red-300 inline-block"
                              title="Delete Post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT POST MODAL */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl my-auto">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">
                  {editingPost ? 'Edit Blog Article' : 'Write New Blog Article'}
                </h3>
                <span className="text-xs text-[#8A93A3]">
                  Reading time approx:{' '}
                  {calculateReadingTime(formContent[contentLangTab] || formContent.en || '')} min
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="text-[#8A93A3] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSavePost} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <TranslatableField
                    label="Article Title"
                    value={formTitle}
                    onChange={handleTitleChange}
                    requiredEn
                    placeholder={{ en: 'e.g. How to Protect Your Engine in Summer' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Slug (URL Key) <span className="text-[#FF6A00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. summer-heat-engine-protection"
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Category
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <TranslatableField
                label="Summary / Excerpt"
                multiline
                rows={2}
                value={formExcerpt}
                onChange={setFormExcerpt}
                placeholder={{ en: 'A short 1-2 sentence preview for cards and search snippets.' }}
              />

              {/* Markdown Content with Live Preview Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white">
                    Article Markdown Body
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Language selector */}
                    <div className="flex rounded-lg bg-[#12151A] p-0.5 border border-white/10">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setContentLangTab(lang.code)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            contentLangTab === lang.code
                              ? 'bg-[#FF6A00] text-white'
                              : 'text-[#8A93A3] hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>

                    {/* Preview toggle */}
                    <button
                      type="button"
                      onClick={() => setPreviewMarkdown(!previewMarkdown)}
                      className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-white hover:bg-white/10"
                    >
                      {previewMarkdown ? 'Edit Markdown' : 'Preview'}
                    </button>
                  </div>
                </div>

                {previewMarkdown ? (
                  <div className="bg-[#12151A] border border-white/10 rounded-xl p-4 min-h-[220px] max-h-[350px] overflow-y-auto">
                    <Markdown
                      content={formContent[contentLangTab] || formContent.en || ''}
                      lightMode={false}
                    />
                  </div>
                ) : (
                  <textarea
                    rows={10}
                    value={formContent[contentLangTab] || ''}
                    onChange={(e) =>
                      setFormContent({
                        ...formContent,
                        [contentLangTab]: e.target.value,
                      })
                    }
                    placeholder={`Write ${contentLangTab.toUpperCase()} article content in Markdown format...`}
                    dir={contentLangTab === 'ur' ? 'rtl' : 'ltr'}
                    className="w-full bg-[#12151A] border border-white/10 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-[#FF6A00]"
                  />
                )}
              </div>

              {/* Cover Image */}
              <ImageField
                label="Cover Image"
                value={formCoverImage}
                onChange={setFormCoverImage}
                folderPrefix="blog"
                bucketName="site-assets"
              />

              {/* Metadata, Author, Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formTagsString}
                    onChange={(e) => setFormTagsString(e.target.value)}
                    placeholder="e.g. Engine, Coolant, Summer, Sadiqabad"
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Related Services Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Related Workshop Services (Shows booking link in article)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#12151A] border border-white/10 rounded-xl">
                  {services.map((s) => {
                    const isChecked = formRelatedServiceIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 text-xs text-[#8A93A3] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormRelatedServiceIds([...formRelatedServiceIds, s.id]);
                            } else {
                              setFormRelatedServiceIds(
                                formRelatedServiceIds.filter((id) => id !== s.id)
                              );
                            }
                          }}
                          className="rounded border-white/20 bg-white/5 text-[#FF6A00]"
                        />
                        <span className="truncate">{s.name.en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Related Product Categories Multi-Select */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Related Store Product Categories (Shows shop link in article)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#12151A] border border-white/10 rounded-xl">
                  {productCategories.map((pcat) => {
                    const isChecked = formRelatedCategoryIds.includes(pcat.id);
                    return (
                      <label
                        key={pcat.id}
                        className="flex items-center gap-2 text-xs text-[#8A93A3] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormRelatedCategoryIds([...formRelatedCategoryIds, pcat.id]);
                            } else {
                              setFormRelatedCategoryIds(
                                formRelatedCategoryIds.filter((id) => id !== pcat.id)
                              );
                            }
                          }}
                          className="rounded border-white/20 bg-white/5 text-[#FF6A00]"
                        />
                        <span className="truncate">{pcat.name.en}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SEO Title & Description */}
              <div className="pt-2 border-t border-white/10 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] block">
                  Search Engine Optimization (SEO)
                </span>
                <TranslatableField
                  label="Custom SEO Meta Title (Optional)"
                  value={formSeoTitle}
                  onChange={setFormSeoTitle}
                />
                <TranslatableField
                  label="Custom SEO Meta Description (Optional)"
                  multiline
                  rows={2}
                  value={formSeoDescription}
                  onChange={setFormSeoDescription}
                />
              </div>

              {/* Publish Toggle & Published Date */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-white font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF6A00]"
                    />
                    <span>Publish Immediately</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8A93A3]">
                  <span>Publish Date/Time:</span>
                  <input
                    type="datetime-local"
                    value={formPublishedAt}
                    onChange={(e) => setFormPublishedAt(e.target.value)}
                    className="bg-[#12151A] border border-white/10 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsCreatingPost(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={savingPost}
                >
                  {editingPost ? 'Save Changes' : 'Create Article'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Create Blog Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="text-[#8A93A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <TranslatableField
                label="Category Name"
                value={catName}
                onChange={(next) => {
                  setCatName(next);
                  if (!editingCategory && next.en && !catSlug) {
                    setCatSlug(slugify(next.en));
                  }
                }}
                requiredEn
              />

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Category Slug
                </label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(Number(e.target.value))}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-white font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="rounded text-[#FF6A00]"
                />
                <span>Active</span>
              </label>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingCategory(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingCategory}
                >
                  Save Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmPostId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Delete Article?</h3>
            <p className="text-xs text-[#8A93A3] mb-6">
              This action cannot be undone. The article and its URL will no longer be accessible.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmPostId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeletePost(deleteConfirmPostId)}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
