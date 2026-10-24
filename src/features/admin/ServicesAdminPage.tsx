import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  Wand2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import {
  formatServicePriceLabel,
  invalidateServicesCache,
  normalizeServiceRow,
} from '../services/useServices';
import { getLocalized } from '../../i18n/helpers';
import {
  createServiceFormSchema,
  type ServiceFormValues,
} from '../../lib/validators';
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
import {
  SERVICE_ICON_OPTIONS,
  ServiceIcon,
} from '../../components/common/ServiceIcon';
import { TranslatableField } from '../../components/common/TranslatableField';
import { ImageField } from '../../components/common/ImageField';
import type { LocalizedStringList, LocalizedText, ServiceRow } from '../../types/database';

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function listToMultilineText(list?: LocalizedStringList | null): Required<LocalizedText> {
  return {
    en: Array.isArray(list?.en) ? list.en.join('\n') : '',
    ur: Array.isArray(list?.ur) ? list.ur.join('\n') : '',
    'ur-roman': Array.isArray(list?.['ur-roman'])
      ? list['ur-roman'].join('\n')
      : '',
  };
}

function multilineTextToList(text: LocalizedText): LocalizedStringList {
  const splitLines = (str?: string) =>
    (str || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    en: splitLines(text.en),
    ur: splitLines(text.ur),
    'ur-roman': splitLines(text['ur-roman']),
  };
}

function emptyLocalized(): Required<LocalizedText> {
  return { en: '', ur: '', 'ur-roman': '' };
}

function toRequiredLocalized(val?: LocalizedText | null): Required<LocalizedText> {
  return {
    en: val?.en ?? '',
    ur: val?.ur ?? '',
    'ur-roman': val?.['ur-roman'] ?? '',
  };
}

export default function ServicesAdminPage() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<ServiceRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAllServices = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        toast.error(t('common.errorDescription'));
        return;
      }
      setServices(((data ?? []) as ServiceRow[]).map(normalizeServiceRow));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAllServices();
  }, [loadAllServices]);

  const schema = createServiceFormSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: '',
      name: emptyLocalized(),
      short_description: emptyLocalized(),
      description: emptyLocalized(),
      includesText: emptyLocalized(),
      estimated_time: emptyLocalized(),
      price_from_str: '',
      price_to_str: '',
      price_note: emptyLocalized(),
      image_url: '',
      icon: 'Wrench',
      sort_order: 1,
      is_active: true,
      is_featured: false,
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormOpen && isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormOpen, isDirty]);

  const openCreateForm = () => {
    const nextOrder =
      services.length > 0
        ? Math.max(...services.map((s) => s.sort_order)) + 1
        : 1;
    setEditingService(null);
    reset({
      slug: '',
      name: emptyLocalized(),
      short_description: emptyLocalized(),
      description: emptyLocalized(),
      includesText: emptyLocalized(),
      estimated_time: emptyLocalized(),
      price_from_str: '',
      price_to_str: '',
      price_note: emptyLocalized(),
      image_url: '',
      icon: 'Wrench',
      sort_order: nextOrder,
      is_active: true,
      is_featured: false,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (srv: ServiceRow) => {
    setEditingService(srv);
    reset({
      slug: srv.slug,
      name: toRequiredLocalized(srv.name),
      short_description: toRequiredLocalized(srv.short_description),
      description: toRequiredLocalized(srv.description),
      includesText: listToMultilineText(srv.includes),
      estimated_time: toRequiredLocalized(srv.estimated_time),
      price_from_str: srv.price_from !== null ? String(srv.price_from) : '',
      price_to_str: srv.price_to !== null ? String(srv.price_to) : '',
      price_note: toRequiredLocalized(srv.price_note),
      image_url: srv.image_url ?? '',
      icon: srv.icon || 'Wrench',
      sort_order: srv.sort_order,
      is_active: srv.is_active,
      is_featured: srv.is_featured,
    });
    setIsFormOpen(true);
  };

  const watchedName = watch('name');
  const watchedShortDesc = watch('short_description');
  const watchedDescription = watch('description');
  const watchedIncludesText = watch('includesText');
  const watchedEstimatedTime = watch('estimated_time');
  const watchedPriceNote = watch('price_note');
  const watchedImageUrl = watch('image_url');
  const watchedIcon = watch('icon');

  const handleGenerateSlug = () => {
    const generated = slugifyText(watchedName?.en || '');
    if (generated) {
      setValue('slug', generated, { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmitForm = async (values: ServiceFormValues) => {
    // Check slug uniqueness against loaded services
    const duplicate = services.find(
      (s) => s.slug === values.slug && s.id !== editingService?.id
    );
    if (duplicate) {
      setError('slug', { message: t('admin.servicesAdmin.slugTakenError') });
      toast.error(t('admin.servicesAdmin.slugTakenError'));
      return;
    }

    const hasEstimatedTime =
      Boolean(values.estimated_time.en) ||
      Boolean(values.estimated_time.ur) ||
      Boolean(values.estimated_time['ur-roman']);

    const hasPriceNote =
      Boolean(values.price_note.en) ||
      Boolean(values.price_note.ur) ||
      Boolean(values.price_note['ur-roman']);

    const payload = {
      slug: values.slug,
      name: values.name,
      short_description: values.short_description,
      description: values.description,
      includes: multilineTextToList(values.includesText),
      estimated_time: hasEstimatedTime ? values.estimated_time : null,
      price_from:
        values.price_from_str !== '' ? Number(values.price_from_str) : null,
      price_to: values.price_to_str !== '' ? Number(values.price_to_str) : null,
      price_note: hasPriceNote ? values.price_note : null,
      image_url: values.image_url,
      icon: values.icon,
      sort_order: Number(values.sort_order) || 0,
      is_active: values.is_active,
      is_featured: values.is_featured,
    };

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id);

        if (error) {
          toast.error(t('common.errorDescription'));
          return;
        }
      } else {
        const { error } = await supabase.from('services').insert(payload);
        if (error) {
          toast.error(t('common.errorDescription'));
          return;
        }
      }

      invalidateServicesCache();
      toast.success(t('admin.servicesAdmin.savedSuccess'));
      setIsFormOpen(false);
      await loadAllServices();
    } catch {
      toast.error(t('common.errorDescription'));
    }
  };

  const handleToggleFlag = async (
    srv: ServiceRow,
    field: 'is_active' | 'is_featured'
  ) => {
    const nextVal = !srv[field];
    const updatePayload =
      field === 'is_active' ? { is_active: nextVal } : { is_featured: nextVal };
    const { error } = await supabase
      .from('services')
      .update(updatePayload)
      .eq('id', srv.id);

    if (error) {
      toast.error(t('common.errorDescription'));
      return;
    }

    invalidateServicesCache();
    setServices((prev) =>
      prev.map((item) =>
        item.id === srv.id ? { ...item, [field]: nextVal } : item
      )
    );
    toast.success(t('admin.servicesAdmin.savedSuccess'));
  };

  const handleMoveSortOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const current = services[index];
    const neighbor = services[targetIndex];
    if (!current || !neighbor) return;

    const currentOrder = current.sort_order;
    const neighborOrder =
      neighbor.sort_order === currentOrder
        ? direction === 'up'
          ? currentOrder - 1
          : currentOrder + 1
        : neighbor.sort_order;

    await Promise.all([
      supabase
        .from('services')
        .update({ sort_order: neighborOrder })
        .eq('id', current.id),
      supabase
        .from('services')
        .update({ sort_order: currentOrder })
        .eq('id', neighbor.id),
    ]);

    invalidateServicesCache();
    await loadAllServices();
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', deletingService.id);

      if (error) {
        toast.error(t('common.errorDescription'));
        return;
      }

      invalidateServicesCache();
      toast.success(t('admin.servicesAdmin.deletedSuccess'));
      setDeletingService(null);
      await loadAllServices();
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => {
      const nameEn = (s.name?.en || '').toLowerCase();
      const nameCurrent = getLocalized(s, 'name', i18n.language).toLowerCase();
      return (
        nameEn.includes(q) ||
        nameCurrent.includes(q) ||
        s.slug.toLowerCase().includes(q)
      );
    });
  }, [services, searchQuery, i18n.language]);

  if (isFormOpen) {
    return (
      <div className="space-y-6 text-start pb-16">
        <Seo title={t('admin.servicesAdmin.seoTitle')} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A93A3] hover:text-white mb-2"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip" />
              <span>{t('admin.shared.backToList')}</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
              {editingService
                ? t('admin.servicesAdmin.editServiceTitle')
                : t('admin.servicesAdmin.createServiceTitle')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC21A]">
                <AlertCircle className="w-4 h-4" />
                <span>{t('admin.settings.unsavedWarning')}</span>
              </span>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmitForm)}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSubmitting ? t('admin.shared.saving') : t('admin.shared.saveBtn')}
            </Button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitForm)}
          noValidate
          className="space-y-6"
        >
          <Card className="p-6 sm:p-8 space-y-6">
            <TranslatableField
              requiredEn
              label={t('admin.servicesAdmin.fields.name')}
              value={watchedName}
              onChange={(next) =>
                setValue('name', toRequiredLocalized(next), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={errors.name?.en?.message}
            />

            {/* Slug + Generate button + Sort Order */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6">
                <Input
                  dir="ltr"
                  label={t('admin.servicesAdmin.fields.slug')}
                  placeholder="engine-repair"
                  error={errors.slug?.message}
                  {...register('slug')}
                />
              </div>

              <div className="md:col-span-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={handleGenerateSlug}
                  leftIcon={<Wand2 className="w-4 h-4 text-[#FF6A00]" />}
                >
                  {t('admin.servicesAdmin.fields.generateSlug')}
                </Button>
              </div>

              <div className="md:col-span-3">
                <Input
                  type="number"
                  dir="ltr"
                  label={t('admin.servicesAdmin.fields.sortOrder')}
                  error={errors.sort_order?.message}
                  {...register('sort_order', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Icon Select with Live Preview + Active/Featured Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-sm font-medium text-[#F5F6F8]">
                  {t('admin.servicesAdmin.fields.icon')}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#0E1013] border border-white/15 text-[#FF6A00] flex items-center justify-center shrink-0">
                    <ServiceIcon name={watchedIcon} className="w-5 h-5" />
                  </div>
                  <select
                    className="w-full rounded-md px-3.5 py-2.5 text-sm bg-[#1B1F26] text-[#F5F6F8] border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                    {...register('icon')}
                  >
                    {SERVICE_ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic} className="bg-[#1B1F26]">
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-7 flex flex-wrap items-center gap-6 pt-4">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#FF6A00] rounded"
                    {...register('is_active')}
                  />
                  <span className="text-sm font-medium text-white">
                    {t('admin.servicesAdmin.fields.isActive')}
                  </span>
                </label>

                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#FF6A00] rounded"
                    {...register('is_featured')}
                  />
                  <span className="text-sm font-medium text-white">
                    {t('admin.servicesAdmin.fields.isFeatured')}
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Descriptions & What's Included */}
          <Card className="p-6 sm:p-8 space-y-6">
            <TranslatableField
              multiline
              rows={2}
              label={t('admin.servicesAdmin.fields.shortDescription')}
              value={watchedShortDesc}
              onChange={(next) =>
                setValue('short_description', toRequiredLocalized(next), {
                  shouldDirty: true,
                })
              }
            />

            <TranslatableField
              multiline
              rows={4}
              label={t('admin.servicesAdmin.fields.description')}
              value={watchedDescription}
              onChange={(next) =>
                setValue('description', toRequiredLocalized(next), {
                  shouldDirty: true,
                })
              }
            />

            <TranslatableField
              multiline
              rows={5}
              label={t('admin.servicesAdmin.fields.includes')}
              value={watchedIncludesText}
              onChange={(next) =>
                setValue('includesText', toRequiredLocalized(next), {
                  shouldDirty: true,
                })
              }
            />
          </Card>

          {/* Pricing, Estimated Time & Image */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                type="number"
                min="0"
                step="1"
                dir="ltr"
                label={t('admin.servicesAdmin.fields.priceFrom')}
                placeholder="e.g. 2500"
                error={errors.price_from_str?.message}
                {...register('price_from_str')}
              />

              <Input
                type="number"
                min="0"
                step="1"
                dir="ltr"
                label={t('admin.servicesAdmin.fields.priceTo')}
                placeholder="e.g. 6000"
                error={errors.price_to_str?.message}
                {...register('price_to_str')}
              />
            </div>

            <TranslatableField
              label={t('admin.servicesAdmin.fields.priceNote')}
              value={watchedPriceNote}
              onChange={(next) =>
                setValue('price_note', toRequiredLocalized(next), {
                  shouldDirty: true,
                })
              }
            />

            <TranslatableField
              label={t('admin.servicesAdmin.fields.estimatedTime')}
              value={watchedEstimatedTime}
              onChange={(next) =>
                setValue('estimated_time', toRequiredLocalized(next), {
                  shouldDirty: true,
                })
              }
            />

            <ImageField
              label={t('admin.servicesAdmin.fields.image')}
              value={watchedImageUrl}
              onChange={(url) =>
                setValue('image_url', url, { shouldDirty: true })
              }
              folderPrefix="services"
              error={errors.image_url?.message}
            />
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSubmitting ? t('admin.shared.saving') : t('admin.shared.saveBtn')}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start pb-16">
      <Seo title={t('admin.servicesAdmin.seoTitle')} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white heading-accent mb-3">
            {t('admin.servicesAdmin.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">
            {t('admin.servicesAdmin.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={openCreateForm}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('admin.servicesAdmin.addServiceBtn')}
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#8A93A3] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.servicesAdmin.searchPlaceholder')}
            className="w-full rounded-md ps-10 pe-4 py-2 text-sm bg-[#0E1013] text-[#F5F6F8] placeholder:text-[#8A93A3]/70 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
          />
        </div>
      </Card>

      {/* Services List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title={t('admin.servicesAdmin.emptyTitle')}
          description={t('admin.servicesAdmin.emptyDesc')}
        />
      ) : (
        <div className="space-y-3">
          {filteredServices.map((srv, idx) => {
            const name = getLocalized(srv, 'name', i18n.language);
            const priceLabel = formatServicePriceLabel(srv, t);
            const canReorder = !searchQuery.trim();

            return (
              <Card
                key={srv.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  {srv.image_url?.trim() ? (
                    <img
                      src={srv.image_url.trim()}
                      alt={name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-md object-cover bg-[#0E1013] border border-white/15 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-[#0E1013] border border-white/15 text-[#FF6A00] flex items-center justify-center shrink-0">
                      <ServiceIcon name={srv.icon} className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold font-heading text-white truncate">
                        {name}
                      </h2>
                      <span
                        dir="ltr"
                        className="text-xs text-[#8A93A3] font-mono"
                      >
                        /{srv.slug}
                      </span>
                      <Badge variant={srv.is_active ? 'success' : 'default'}>
                        {srv.is_active
                          ? t('admin.servicesAdmin.statusActive')
                          : t('admin.servicesAdmin.statusInactive')}
                      </Badge>
                      {srv.is_featured && (
                        <Badge variant="accent">
                          {t('admin.servicesAdmin.featuredBadge')}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-[#8A93A3]">
                      {priceLabel} · #{srv.sort_order}
                    </p>
                  </div>
                </div>

                {/* Quick Toggles, Reorder, Edit, Delete */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleToggleFlag(srv, 'is_active')}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold bg-[#0E1013] border border-white/15 text-[#F5F6F8] hover:border-[#FF6A00] transition-colors"
                  >
                    {srv.is_active
                      ? t('admin.servicesAdmin.statusActive')
                      : t('admin.servicesAdmin.statusInactive')}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleFlag(srv, 'is_featured')}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold bg-[#0E1013] border border-white/15 text-[#F5F6F8] hover:border-[#FFC21A] transition-colors"
                  >
                    {t('admin.servicesAdmin.featuredBadge')}
                  </button>

                  {canReorder && (
                    <div className="inline-flex items-center rounded bg-[#0E1013] border border-white/15">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => void handleMoveSortOrder(idx, 'up')}
                        aria-label={t('admin.servicesAdmin.moveUp')}
                        className="p-1.5 text-[#8A93A3] hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === filteredServices.length - 1}
                        onClick={() => void handleMoveSortOrder(idx, 'down')}
                        aria-label={t('admin.servicesAdmin.moveDown')}
                        className="p-1.5 text-[#8A93A3] hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditForm(srv)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    {t('admin.shared.editBtn')}
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingService(srv)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    {t('admin.shared.deleteBtn')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingService)}
        onClose={() => setDeletingService(null)}
        title={t('admin.shared.confirmDeleteTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingService(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting
                ? t('admin.shared.deleting')
                : t('admin.shared.deleteBtn')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#F5F6F8]">
          {t('admin.servicesAdmin.deleteConfirmText', {
            name: deletingService
              ? getLocalized(deletingService, 'name', i18n.language)
              : '',
          })}
        </p>
      </Modal>
    </div>
  );
}
