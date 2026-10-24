import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Edit3,
  FlaskConical,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { BrandRow } from '../../types/database';
import { isPhase5MissingError } from '../catalogue/useCatalogueData';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Skeleton,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { ImageField } from '../../components/common/ImageField';

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BrandsAdminPage() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [schemaMissing, setSchemaMissing] = useState<boolean>(false);

  // Create / Edit Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete confirmation modal
  const [deletingBrand, setDeletingBrand] = useState<BrandRow | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [brandsRes, prodRes] = await Promise.all([
        supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true }),
        supabase.from('products').select('id, brand_id'),
      ]);

      if (brandsRes.error) {
        if (isPhase5MissingError(brandsRes.error)) {
          setSchemaMissing(true);
        } else {
          toast.error(brandsRes.error.message);
        }
        setBrands([]);
        return;
      }

      setSchemaMissing(false);
      setBrands((brandsRes.data ?? []) as BrandRow[]);

      if (!prodRes.error && prodRes.data) {
        const counts: Record<string, number> = {};
        for (const p of prodRes.data as Array<{
          id: string;
          brand_id: string | null;
        }>) {
          if (p.brand_id) {
            counts[p.brand_id] = (counts[p.brand_id] ?? 0) + 1;
          }
        }
        setProductCounts(counts);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setLogoUrl('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (brand: BrandRow) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setLogoUrl(brand.logo_url ?? '');
    setIsActive(brand.is_active);
    setModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingBrand) {
      setSlug(slugifyText(value));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = slugifyText(slug || cleanName);

    if (!cleanName || !cleanSlug) {
      toast.error(t('admin.brands.validationError'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: cleanName,
        slug: cleanSlug,
        logo_url: logoUrl.trim() || null,
        is_active: isActive,
      };

      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(payload)
          .eq('id', editingBrand.id);

        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t('admin.brands.updatedToast'));
      } else {
        const { error } = await supabase.from('brands').insert(payload);

        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(t('admin.brands.createdToast'));
      }

      setModalOpen(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (brand: BrandRow) => {
    const nextActive = !brand.is_active;
    const { error } = await supabase
      .from('brands')
      .update({ is_active: nextActive })
      .eq('id', brand.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('admin.brands.updatedToast'));
    await loadData();
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingBrand) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', deletingBrand.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('admin.brands.deletedToast'));
      setDeletingBrand(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <Seo title={t('admin.brands.title')} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.brands.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">
            {t('admin.brands.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={schemaMissing}
        >
          {t('admin.brands.addBrand')}
        </Button>
      </div>

      {schemaMissing && (
        <Card className="p-5 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">
              {t('shop.schemaMissingTitle')}
            </h2>
            <p className="text-xs text-[#F5F6F8]/85">
              {t('shop.schemaMissingDescription')}
            </p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full bg-[#1B1F26]" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6" />}
          title={t('admin.brands.emptyTitle')}
          description={t('admin.brands.emptyDescription')}
          action={
            !schemaMissing ? (
              <Button
                variant="primary"
                onClick={openCreateModal}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('admin.brands.addBrand')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => {
            const count = productCounts[brand.id] ?? 0;
            return (
              <Card
                key={brand.id}
                className="p-5 flex flex-col justify-between gap-4 border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {brand.logo_url ? (
                      <div className="w-12 h-12 rounded-md bg-white p-1.5 flex items-center justify-center shrink-0 overflow-hidden border border-white/15">
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-[#2A2F38] border border-white/10 flex items-center justify-center text-[#FF6A00] font-bold font-heading text-lg shrink-0">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold font-heading text-white truncate">
                          {brand.name}
                        </h2>
                        {brand.is_demo && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                            <FlaskConical className="w-2.5 h-2.5" />
                            <span>{t('demo.badge')}</span>
                          </span>
                        )}
                      </div>
                      <p
                        dir="ltr"
                        className="text-xs font-mono text-[#8A93A3] truncate"
                      >
                        /{brand.slug}
                      </p>
                    </div>
                  </div>

                  <Badge variant={brand.is_active ? 'success' : 'neutral'}>
                    {brand.is_active
                      ? t('admin.common.active')
                      : t('admin.common.inactive')}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-xs text-[#8A93A3]">
                    {t('admin.brands.productsLinked', { count })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleToggleActive(brand)}
                      title={
                        brand.is_active
                          ? t('admin.common.deactivate')
                          : t('admin.common.activate')
                      }
                    >
                      {brand.is_active ? (
                        <XCircle className="w-4 h-4 text-[#8A93A3]" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(brand)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingBrand(brand)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Brand Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={
          editingBrand
            ? t('admin.brands.editBrand')
            : t('admin.brands.addBrand')
        }
        size="md"
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <Input
            label={t('admin.brands.nameLabel')}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Apex Japan / PAW OEM-Spec / VoltMax"
            required
          />

          <Input
            label={t('admin.brands.slugLabel')}
            value={slug}
            onChange={(e) => setSlug(slugifyText(e.target.value))}
            dir="ltr"
            placeholder="apex-japan"
            required
          />

          <ImageField
            label={t('admin.brands.logoLabel')}
            hint={t('admin.brands.logoHint')}
            value={logoUrl}
            onChange={setLogoUrl}
            folderPrefix="brands"
            bucketName="product-images"
          />

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-white/20 bg-[#0E1013] text-[#FF6A00] focus:ring-[#FF6A00]"
            />
            <span className="text-sm font-medium text-[#F5F6F8]">
              {t('admin.brands.activeLabel')}
            </span>
          </label>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
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
        isOpen={Boolean(deletingBrand)}
        onClose={() => !deleting && setDeletingBrand(null)}
        title={t('admin.brands.deleteTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8A93A3]">
            {t('admin.brands.deleteConfirm', {
              name: deletingBrand?.name ?? '',
            })}
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingBrand(null)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleDeleteConfirmed()}
              isLoading={deleting}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
