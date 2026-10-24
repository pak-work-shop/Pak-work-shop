import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Edit3,
  Eye,
  FileText,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { invalidatePagesCache } from '../legal/usePage';
import { getLocalized } from '../../i18n/helpers';
import {
  createLegalPageFormSchema,
  type LegalPageFormValues,
} from '../../lib/validators';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { TranslatableField } from '../../components/common/TranslatableField';
import { Markdown } from '../../components/common/Markdown';
import type { LocalizedText, PageRow } from '../../types/database';

function toRequiredLocalized(val?: LocalizedText | null): Required<LocalizedText> {
  return {
    en: val?.en ?? '',
    ur: val?.ur ?? '',
    'ur-roman': val?.['ur-roman'] ?? '',
  };
}

export default function LegalPagesAdminPage() {
  const { t, i18n } = useTranslation();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);
  const [editingPage, setEditingPage] = useState<PageRow | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const loadPages = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('slug', { ascending: true });

      if (!error && data) {
        setPages(data as PageRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const schema = createLegalPageFormSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<LegalPageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: { en: '', ur: '', 'ur-roman': '' },
      content: { en: '', ur: '', 'ur-roman': '' },
      is_published: true,
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editingPage && isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editingPage, isDirty]);

  const openEditor = (page: PageRow) => {
    setEditingPage(page);
    setPreviewMode(false);
    reset({
      title: toRequiredLocalized(page.title),
      content: toRequiredLocalized(page.content),
      is_published: page.is_published,
    });
  };

  const watchedTitle = watch('title');
  const watchedContent = watch('content');

  const onSubmit = async (values: LegalPageFormValues) => {
    if (!editingPage) return;

    const { error } = await supabase
      .from('pages')
      .update({
        title: values.title,
        content: values.content,
        is_published: values.is_published,
      })
      .eq('id', editingPage.id);

    if (error) {
      toast.error(t('common.errorDescription'));
      return;
    }

    invalidatePagesCache();
    toast.success(t('admin.pagesAdmin.savedSuccess'));
    setEditingPage(null);
    await loadPages();
  };

  if (editingPage) {
    const previewText =
      getLocalized({ content: watchedContent }, 'content', i18n.language) ||
      watchedContent.en ||
      '';

    return (
      <div className="space-y-6 text-start pb-16">
        <Seo title={t('admin.pagesAdmin.seoTitle')} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setEditingPage(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A93A3] hover:text-white mb-2"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip" />
              <span>{t('admin.shared.backToList')}</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
              {t('admin.pagesAdmin.editPageTitle', { slug: editingPage.slug })}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC21A]">
                <AlertCircle className="w-4 h-4" />
                <span>{t('admin.settings.unsavedWarning')}</span>
              </span>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewMode((prev) => !prev)}
              leftIcon={<Eye className="w-4 h-4 text-[#FF6A00]" />}
            >
              {previewMode
                ? t('admin.pagesAdmin.editToggle')
                : t('admin.pagesAdmin.previewToggle')}
            </Button>

            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSubmitting ? t('admin.shared.saving') : t('admin.shared.saveBtn')}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#FF6A00] rounded"
                  {...register('is_published')}
                />
                <span className="text-sm font-semibold text-white">
                  {t('admin.pagesAdmin.isPublishedLabel')}
                </span>
              </label>

              <span className="text-xs text-[#8A93A3]">
                {t('legal.lastUpdated', {
                  date: new Date(editingPage.updated_at).toLocaleDateString(),
                })}
              </span>
            </div>

            <TranslatableField
              requiredEn
              label={t('admin.pagesAdmin.titleField')}
              value={watchedTitle}
              onChange={(next) =>
                setValue('title', toRequiredLocalized(next), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={errors.title?.en?.message}
            />

            {previewMode ? (
              <div className="p-6 rounded-lg bg-white text-[#12151A] border border-slate-200">
                <Markdown content={previewText} lightMode />
              </div>
            ) : (
              <TranslatableField
                requiredEn
                multiline
                rows={14}
                label={t('admin.pagesAdmin.contentField')}
                value={watchedContent}
                onChange={(next) =>
                  setValue('content', toRequiredLocalized(next), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                error={errors.content?.en?.message}
              />
            )}
          </Card>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start pb-16">
      <Seo title={t('admin.pagesAdmin.seoTitle')} />

      <div>
        <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white heading-accent mb-3">
          {t('admin.pagesAdmin.title')}
        </h1>
        <p className="text-sm text-[#8A93A3]">{t('admin.pagesAdmin.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <EmptyState
          title={t('legal.notFoundTitle')}
          description={t('legal.notFoundDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pages.map((page) => {
            const title = getLocalized(page, 'title', i18n.language);
            return (
              <Card
                key={page.id}
                className="p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF6A00]"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>/{page.slug}</span>
                    </span>

                    <Badge variant={page.is_published ? 'success' : 'default'}>
                      {page.is_published
                        ? t('admin.pagesAdmin.publishedBadge')
                        : t('admin.pagesAdmin.draftBadge')}
                    </Badge>
                  </div>

                  <h2 className="text-xl font-bold font-heading text-white">
                    {title}
                  </h2>

                  <p className="text-xs text-[#8A93A3] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>
                      {t('legal.lastUpdated', {
                        date: new Date(page.updated_at).toLocaleDateString(),
                      })}
                    </span>
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditor(page)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    {t('admin.shared.editBtn')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
