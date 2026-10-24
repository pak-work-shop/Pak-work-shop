import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { invalidateFaqsCache } from '../faq/useFaqs';
import { getLocalized } from '../../i18n/helpers';
import {
  createFaqFormSchema,
  type FaqFormValues,
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
import { TranslatableField } from '../../components/common/TranslatableField';
import { cn } from '../../lib/utils';
import type {
  FaqCategory,
  FaqRow,
  LocalizedText,
  ServiceRow,
} from '../../types/database';

const FAQ_CATEGORIES: ReadonlyArray<FaqCategory> = [
  'general',
  'services',
  'booking',
  'parts',
  'delivery',
  'payments',
];

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

export default function FaqsAdminPage() {
  const { t, i18n } = useTranslation();
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);
  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFaq, setEditingFaq] = useState<FaqRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<FaqRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [faqsRes, servicesRes] = await Promise.all([
        supabase
          .from('faqs')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

      if (!faqsRes.error && faqsRes.data) {
        setFaqs(faqsRes.data as FaqRow[]);
      }
      if (!servicesRes.error && servicesRes.data) {
        setServices(servicesRes.data as ServiceRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const schema = createFaqFormSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question: emptyLocalized(),
      answer: emptyLocalized(),
      category: 'general',
      service_id: '',
      sort_order: 1,
      is_active: true,
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
      faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 1;
    setEditingFaq(null);
    reset({
      question: emptyLocalized(),
      answer: emptyLocalized(),
      category: 'general',
      service_id: '',
      sort_order: nextOrder,
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (faq: FaqRow) => {
    setEditingFaq(faq);
    reset({
      question: toRequiredLocalized(faq.question),
      answer: toRequiredLocalized(faq.answer),
      category: faq.category,
      service_id: faq.service_id ?? '',
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setIsFormOpen(true);
  };

  const watchedQuestion = watch('question');
  const watchedAnswer = watch('answer');

  const onSubmitForm = async (values: FaqFormValues) => {
    const payload = {
      question: values.question,
      answer: values.answer,
      category: values.category,
      service_id: values.service_id.trim() || null,
      sort_order: Number(values.sort_order) || 0,
      is_active: values.is_active,
    };

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from('faqs')
          .update(payload)
          .eq('id', editingFaq.id);

        if (error) {
          toast.error(t('common.errorDescription'));
          return;
        }
      } else {
        const { error } = await supabase.from('faqs').insert(payload);
        if (error) {
          toast.error(t('common.errorDescription'));
          return;
        }
      }

      invalidateFaqsCache();
      toast.success(t('admin.faqsAdmin.savedSuccess'));
      setIsFormOpen(false);
      await loadData();
    } catch {
      toast.error(t('common.errorDescription'));
    }
  };

  const handleToggleActive = async (faq: FaqRow) => {
    const nextVal = !faq.is_active;
    const { error } = await supabase
      .from('faqs')
      .update({ is_active: nextVal })
      .eq('id', faq.id);

    if (error) {
      toast.error(t('common.errorDescription'));
      return;
    }

    invalidateFaqsCache();
    setFaqs((prev) =>
      prev.map((item) =>
        item.id === faq.id ? { ...item, is_active: nextVal } : item
      )
    );
    toast.success(t('admin.faqsAdmin.savedSuccess'));
  };

  const handleConfirmDelete = async () => {
    if (!deletingFaq) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', deletingFaq.id);

      if (error) {
        toast.error(t('common.errorDescription'));
        return;
      }

      invalidateFaqsCache();
      toast.success(t('admin.faqsAdmin.deletedSuccess'));
      setDeletingFaq(null);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      if (categoryFilter !== 'all' && faq.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      const qText = getLocalized(faq, 'question', i18n.language).toLowerCase();
      const aText = getLocalized(faq, 'answer', i18n.language).toLowerCase();
      return qText.includes(q) || aText.includes(q);
    });
  }, [faqs, categoryFilter, searchQuery, i18n.language]);

  if (isFormOpen) {
    return (
      <div className="space-y-6 text-start pb-16">
        <Seo title={t('admin.faqsAdmin.seoTitle')} />

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
              {editingFaq
                ? t('admin.faqsAdmin.editFaqTitle')
                : t('admin.faqsAdmin.createFaqTitle')}
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

        <form onSubmit={handleSubmit(onSubmitForm)} noValidate className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <TranslatableField
              requiredEn
              label={t('admin.faqsAdmin.fields.question')}
              value={watchedQuestion}
              onChange={(next) =>
                setValue('question', toRequiredLocalized(next), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={errors.question?.en?.message}
            />

            <TranslatableField
              requiredEn
              multiline
              rows={5}
              label={t('admin.faqsAdmin.fields.answer')}
              value={watchedAnswer}
              onChange={(next) =>
                setValue('answer', toRequiredLocalized(next), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={errors.answer?.en?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F5F6F8]">
                  {t('admin.faqsAdmin.fields.category')}
                </label>
                <select
                  className="w-full rounded-md px-3.5 py-2.5 text-sm bg-[#1B1F26] text-[#F5F6F8] border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                  {...register('category')}
                >
                  {FAQ_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#1B1F26]">
                      {t(`faq.categories.${cat}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#F5F6F8]">
                  {t('admin.faqsAdmin.fields.linkedService')}
                </label>
                <select
                  className="w-full rounded-md px-3.5 py-2.5 text-sm bg-[#1B1F26] text-[#F5F6F8] border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                  {...register('service_id')}
                >
                  <option value="" className="bg-[#1B1F26]">
                    {t('admin.faqsAdmin.fields.noLinkedService')}
                  </option>
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id} className="bg-[#1B1F26]">
                      {getLocalized(srv, 'name', i18n.language)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="number"
                dir="ltr"
                label={t('admin.faqsAdmin.fields.sortOrder')}
                error={errors.sort_order?.message}
                {...register('sort_order', { valueAsNumber: true })}
              />
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#FF6A00] rounded"
                  {...register('is_active')}
                />
                <span className="text-sm font-medium text-white">
                  {t('admin.faqsAdmin.fields.isActive')}
                </span>
              </label>
            </div>
          </Card>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start pb-16">
      <Seo title={t('admin.faqsAdmin.seoTitle')} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white heading-accent mb-3">
            {t('admin.faqsAdmin.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('admin.faqsAdmin.subtitle')}</p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={openCreateForm}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t('admin.faqsAdmin.addFaqBtn')}
        </Button>
      </div>

      {/* Search & Category Filter */}
      <Card className="p-4 space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#8A93A3] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.faqsAdmin.searchPlaceholder')}
            className="w-full rounded-md ps-10 pe-4 py-2 text-sm bg-[#0E1013] text-[#F5F6F8] placeholder:text-[#8A93A3]/70 border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', ...FAQ_CATEGORIES] as const).map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-semibold transition-colors',
                  active
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                )}
              >
                {t(`faq.categories.${cat}`)}
              </button>
            );
          })}
        </div>
      </Card>

      {/* FAQs List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredFaqs.length === 0 ? (
        <EmptyState
          title={t('admin.faqsAdmin.emptyTitle')}
          description={t('admin.faqsAdmin.emptyDesc')}
        />
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const qText = getLocalized(faq, 'question', i18n.language);
            const aText = getLocalized(faq, 'answer', i18n.language);
            const linkedService = faq.service_id
              ? services.find((s) => s.id === faq.service_id)
              : null;

            return (
              <Card
                key={faq.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">
                      {t(`faq.categories.${faq.category}`)}
                    </Badge>
                    {linkedService && (
                      <Badge variant="info">
                        {getLocalized(linkedService, 'name', i18n.language)}
                      </Badge>
                    )}
                    <Badge variant={faq.is_active ? 'success' : 'default'}>
                      {faq.is_active
                        ? t('admin.servicesAdmin.statusActive')
                        : t('admin.servicesAdmin.statusInactive')}
                    </Badge>
                    <span className="text-xs text-[#8A93A3]">
                      #{faq.sort_order}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                    {qText}
                  </h2>
                  <p className="text-xs text-[#8A93A3] line-clamp-2">{aText}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(faq)}
                    className="px-2.5 py-1.5 rounded text-xs font-semibold bg-[#0E1013] border border-white/15 text-[#F5F6F8] hover:border-[#FF6A00]"
                  >
                    {faq.is_active
                      ? t('admin.servicesAdmin.statusActive')
                      : t('admin.servicesAdmin.statusInactive')}
                  </button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditForm(faq)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    {t('admin.shared.editBtn')}
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingFaq(faq)}
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
        isOpen={Boolean(deletingFaq)}
        onClose={() => setDeletingFaq(null)}
        title={t('admin.shared.confirmDeleteTitle')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingFaq(null)}
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
          {t('admin.faqsAdmin.deleteConfirmText')}
        </p>
      </Modal>
    </div>
  );
}
