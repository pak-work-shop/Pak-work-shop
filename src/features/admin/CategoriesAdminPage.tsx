import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  FolderTree,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import type {
  LanguageCode,
  LocalizedText,
  ProductCategoryRow,
} from '../../types/database';
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
} from '../catalogue/CategoryIllustration';
import { isPhase5MissingError } from '../catalogue/useCatalogueData';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { ImageField } from '../../components/common/ImageField';
import { cn } from '../../lib/utils';

const LANG_TABS: ReadonlyArray<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ur-roman', label: 'Roman Urdu' },
];

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoriesAdminPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<ProductCategoryRow[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [schemaMissing, setSchemaMissing] = useState<boolean>(false);

  // Create / Edit Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<ProductCategoryRow | null>(null);
  const [langTab, setLangTab] = useState<LanguageCode>('en');

  const [nameMap, setNameMap] = useState<LocalizedText>({
    en: '',
    ur: '',
    'ur-roman': '',
  });
  const [descMap, setDescMap] = useState<LocalizedText>({
    en: '',
    ur: '',
    'ur-roman': '',
  });
  const [slug, setSlug] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [icon, setIcon] = useState<string>('Package');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete confirmation modal state
  const [deletingCat, setDeletingCat] = useState<ProductCategoryRow | null>(
    null
  );
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase
          .from('product_categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase.from('products').select('id, category_id'),
      ]);

      if (catRes.error) {
        if (isPhase5MissingError(catRes.error)) {
          setSchemaMissing(true);
        }
        setCategories([]);
        return;
      }

      setSchemaMissing(false);
      setCategories((catRes.data ?? []) as ProductCategoryRow[]);

      const counts: Record<string, number> = {};
      for (const p of (prodRes.data ?? []) as Array<{
        id: string;
        category_id: string | null;
      }>) {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
        }
      }
      setProductCounts(counts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingCat(null);
    setLangTab('en');
    setNameMap({ en: '', ur: '', 'ur-roman': '' });
    setDescMap({ en: '', ur: '', 'ur-roman': '' });
    setSlug('');
    setParentId('');
    setIcon('Package');
    setImageUrl('');
    setSortOrder(String(categories.length + 1));
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: ProductCategoryRow) => {
    setEditingCat(cat);
    setLangTab('en');
    setNameMap({
      en: cat.name?.en ?? '',
      ur: cat.name?.ur ?? '',
      'ur-roman': cat.name?.['ur-roman'] ?? '',
    });
    setDescMap({
      en: cat.description?.en ?? '',
      ur: cat.description?.ur ?? '',
      'ur-roman': cat.description?.['ur-roman'] ?? '',
    });
    setSlug(cat.slug);
    setParentId(cat.parent_id ?? '');
    setIcon(cat.icon || 'Package');
    setImageUrl(cat.image_url ?? '');
    setSortOrder(String(cat.sort_order ?? 0));
    setIsActive(cat.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEnName = (nameMap.en ?? '').trim();
    const cleanSlug = slugifyText(slug || cleanEnName);

    if (!cleanEnName || !cleanSlug) {
      toast.error(t('admin.categories.validationError'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: {
          en: cleanEnName,
          ur: (nameMap.ur ?? '').trim(),
          'ur-roman': (nameMap['ur-roman'] ?? '').trim(),
        },
        description: {
          en: (descMap.en ?? '').trim(),
          ur: (descMap.ur ?? '').trim(),
          'ur-roman': (descMap['ur-roman'] ?? '').trim(),
        },
        slug: cleanSlug,
        parent_id: parentId || null,
        icon: icon || 'Package',
        image_url: imageUrl.trim(),
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };

      if (editingCat) {
        const { error } = await supabase
          .from('product_categories')
          .update(payload)
          .eq('id', editingCat.id);
        if (error) {
          toast.error(error.message || t('admin.categories.saveError'));
          return;
        }
        toast.success(t('admin.categories.updatedSuccess'));
      } else {
        const { error } = await supabase.from('product_categories').insert({
          ...payload,
          is_demo: false,
        });
        if (error) {
          toast.error(error.message || t('admin.categories.saveError'));
          return;
        }
        toast.success(t('admin.categories.createdSuccess'));
      }

      setModalOpen(false);
      void loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: ProductCategoryRow) => {
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id);

    if (error) {
      toast.error(t('admin.categories.saveError'));
      return;
    }
    toast.success(t('admin.categories.updatedSuccess'));
    void loadData();
  };

  const handleConfirmDelete = async () => {
    if (!deletingCat) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', deletingCat.id);
      if (error) {
        toast.error(error.message || t('admin.categories.deleteError'));
        return;
      }
      toast.success(t('admin.categories.deletedSuccess'));
      setDeletingCat(null);
      void loadData();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <Seo title={t('admin.categories.title')} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.categories.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">
            {t('admin.categories.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          {t('admin.categories.addBtn')}
        </Button>
      </div>

      {schemaMissing && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">
              {t('common.databaseSetupNeededTitle')}
            </h2>
            <p className="text-xs text-[#F5F6F8]/85">
              {t('shop.schemaMissingDesc')}
            </p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title={t('admin.categories.emptyTitle')}
          description={t('admin.categories.emptyDesc')}
          action={
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              {t('admin.categories.addBtn')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const count = productCounts[cat.id] ?? 0;
            const parentCat = cat.parent_id
              ? categories.find((c) => c.id === cat.parent_id)
              : null;

            return (
              <Card
                key={cat.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-white/10"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-md bg-[#2A2F38] text-[#FF6A00] flex items-center justify-center shrink-0">
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        dir="ltr"
                        className="text-xs font-mono text-[#FFC21A]"
                      >
                        #{cat.sort_order}
                      </span>
                      <h3 className="text-base font-bold font-heading text-white">
                        {getLocalized(cat, 'name', i18n.language)}
                      </h3>
                      <span
                        dir="ltr"
                        className="text-xs font-mono text-[#8A93A3]"
                      >
                        ({cat.slug})
                      </span>
                      {cat.is_demo && (
                        <Badge variant="warning">{t('admin.shared.demo')}</Badge>
                      )}
                      {cat.is_active ? (
                        <Badge variant="success">
                          {t('admin.shared.active')}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          {t('admin.shared.inactive')}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-[#8A93A3] flex flex-wrap gap-3">
                      <span>EN: {cat.name?.en || '—'}</span>
                      <span>•</span>
                      <span dir="rtl">UR: {cat.name?.ur || '—'}</span>
                      <span>•</span>
                      <span>Roman: {cat.name?.['ur-roman'] || '—'}</span>
                    </div>

                    {parentCat && (
                      <div className="text-xs text-[#FFC21A] flex items-center gap-1">
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>
                          {t('admin.categories.parentLabel')}:{' '}
                          {getLocalized(parentCat, 'name', i18n.language)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge variant="info">
                    {t('admin.categories.productCountBadge', { count })}
                  </Badge>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleToggleActive(cat)}
                    leftIcon={
                      cat.is_active ? (
                        <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )
                    }
                  >
                    {cat.is_active
                      ? t('admin.shared.deactivate')
                      : t('admin.shared.activate')}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(cat)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#FF6A00]" />}
                  >
                    {t('admin.shared.edit')}
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingCat(cat)}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCat
            ? t('admin.categories.editTitle')
            : t('admin.categories.createTitle')
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5 text-start">
          {/* Language Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            {LANG_TABS.map((tb) => (
              <button
                key={tb.code}
                type="button"
                onClick={() => setLangTab(tb.code)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer',
                  langTab === tb.code
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white'
                )}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <Input
            label={`${t('admin.categories.nameLabel')} (${langTab.toUpperCase()})`}
            value={nameMap[langTab] ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setNameMap((prev) => ({ ...prev, [langTab]: val }));
              if (langTab === 'en' && !editingCat && !slug) {
                setSlug(slugifyText(val));
              }
            }}
            required={langTab === 'en'}
          />

          <Textarea
            label={`${t('admin.categories.descLabel')} (${langTab.toUpperCase()})`}
            rows={3}
            value={descMap[langTab] ?? ''}
            onChange={(e) =>
              setDescMap((prev) => ({ ...prev, [langTab]: e.target.value }))
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('admin.categories.slugLabel')}
              value={slug}
              onChange={(e) => setSlug(slugifyText(e.target.value))}
              required
            />

            <Select
              label={t('admin.categories.parentLabel')}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              options={[
                { value: '', label: t('admin.categories.noParentOption') },
                ...categories
                  .filter((c) => c.id !== editingCat?.id)
                  .map((c) => ({
                    value: c.id,
                    label: getLocalized(c, 'name', i18n.language),
                  })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('admin.categories.iconLabel')}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              options={CATEGORY_ICON_OPTIONS.map((ic) => ({
                value: ic,
                label: ic,
              }))}
            />

            <Input
              type="number"
              label={t('admin.categories.sortOrderLabel')}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <ImageField
            label={t('admin.categories.imageLabel')}
            value={imageUrl}
            onChange={setImageUrl}
            folderPrefix="categories"
            bucketName="product-images"
          />

          <label className="flex items-center gap-2.5 text-sm text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded accent-[#FF6A00]"
            />
            <span>{t('admin.categories.activeToggleLabel')}</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingCat)}
        onClose={() => setDeletingCat(null)}
        title={t('admin.categories.deleteConfirmTitle')}
        size="md"
      >
        {deletingCat && (
          <div className="space-y-4 text-start">
            <p className="text-sm text-[#F5F6F8]">
              {t('admin.categories.deleteConfirmDesc', {
                name: getLocalized(deletingCat, 'name', i18n.language),
              })}
            </p>

            {(productCounts[deletingCat.id] ?? 0) > 0 && (
              <div className="rounded-md bg-amber-500/15 border border-amber-500/40 p-3 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-[#FFC21A] shrink-0 mt-0.5" />
                <span>
                  {t('admin.categories.deleteUsedWarning', {
                    count: productCounts[deletingCat.id] ?? 0,
                  })}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCat(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="danger"
                isLoading={deleting}
                onClick={() => void handleConfirmDelete()}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
