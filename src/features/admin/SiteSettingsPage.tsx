import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  Clock,
  FileText,
  FlaskConical,
  Globe,
  Image as ImageIcon,
  MapPin,
  Megaphone,
  Save,
  Share2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useSiteSettings } from '../settings/useSiteSettings';
import {
  DEFAULT_WORKING_HOURS,
  WEEKDAY_KEYS,
} from '../settings/SiteSettingsContext';
import {
  createSiteSettingsSchema,
  type SiteSettingsFormValues,
} from '../../lib/validators';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { Button, Card, Input, Textarea } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { ImageField } from '../../components/common/ImageField';
import { TranslatableField } from '../../components/common/TranslatableField';
import type { SiteSettingsRow } from '../../types/database';

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function buildFormValuesFromSettings(settings: SiteSettingsRow): SiteSettingsFormValues {
  return {
    business_name: settings.business_name || 'Pak Auto Works & Parts',
    tagline: {
      en: settings.tagline?.en ?? '',
      ur: settings.tagline?.ur ?? '',
      'ur-roman': settings.tagline?.['ur-roman'] ?? '',
    },
    phone: settings.phone || '03126776844',
    whatsapp: settings.whatsapp || '03126776844',
    email: settings.email ?? '',
    address: {
      en: settings.address?.en ?? '',
      ur: settings.address?.ur ?? '',
      'ur-roman': settings.address?.['ur-roman'] ?? '',
    },
    maps_embed_url: settings.maps_embed_url ?? '',
    working_hours: {
      monday: settings.working_hours?.monday ?? DEFAULT_WORKING_HOURS.monday,
      tuesday: settings.working_hours?.tuesday ?? DEFAULT_WORKING_HOURS.tuesday,
      wednesday: settings.working_hours?.wednesday ?? DEFAULT_WORKING_HOURS.wednesday,
      thursday: settings.working_hours?.thursday ?? DEFAULT_WORKING_HOURS.thursday,
      friday: settings.working_hours?.friday ?? DEFAULT_WORKING_HOURS.friday,
      saturday: settings.working_hours?.saturday ?? DEFAULT_WORKING_HOURS.saturday,
      sunday: settings.working_hours?.sunday ?? DEFAULT_WORKING_HOURS.sunday,
    },
    logo_url: settings.logo_url ?? '',
    print_logo_url: settings.print_logo_url ?? '',
    favicon_url: settings.favicon_url ?? '',
    facebook_url: settings.facebook_url ?? '',
    instagram_url: settings.instagram_url ?? '',
    youtube_url: settings.youtube_url ?? '',
    tiktok_url: settings.tiktok_url ?? '',
    announcement: {
      en: settings.announcement?.en ?? '',
      ur: settings.announcement?.ur ?? '',
      'ur-roman': settings.announcement?.['ur-roman'] ?? '',
    },
    announcement_enabled: Boolean(settings.announcement_enabled),
    hero_image_url: settings.hero_image_url ?? '',
    about_image_url: settings.about_image_url ?? '',
    cta_banner_url: settings.cta_banner_url ?? '',
    og_image_url: settings.og_image_url ?? '',
    about_title: {
      en: settings.about_title?.en ?? '',
      ur: settings.about_title?.ur ?? '',
      'ur-roman': settings.about_title?.['ur-roman'] ?? '',
    },
    about_body: {
      en: settings.about_body?.en ?? '',
      ur: settings.about_body?.ur ?? '',
      'ur-roman': settings.about_body?.['ur-roman'] ?? '',
    },
    demo_mode: Boolean(settings.demo_mode),
  };
}

export default function SiteSettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const schema = createSiteSettingsSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildFormValuesFromSettings(settings),
  });

  useEffect(() => {
    reset(buildFormValuesFromSettings(settings));
  }, [settings, reset]);

  // Unsaved-changes safeguard on browser tab close / reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const watchedLogoUrl = watch('logo_url');
  const watchedPrintLogoUrl = watch('print_logo_url');
  const watchedWorkingHours = watch('working_hours');
  const watchedAnnouncementEnabled = watch('announcement_enabled');
  const watchedHeroImageUrl = watch('hero_image_url');
  const watchedAboutImageUrl = watch('about_image_url');
  const watchedCtaBannerUrl = watch('cta_banner_url');
  const watchedOgImageUrl = watch('og_image_url');
  const watchedAboutTitle = watch('about_title');
  const watchedAboutBody = watch('about_body');

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error(t('admin.settings.fields.logoInvalidType'));
      e.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error(t('admin.settings.fields.logoTooLarge'));
      e.target.value = '';
      return;
    }

    if (!env.isConfigured) {
      toast.error(t('admin.settings.fields.logoUploadError'));
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `branding/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        toast.error(t('admin.settings.fields.logoUploadError'));
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setValue('logo_url', publicUrlData.publicUrl, { shouldDirty: true });
        toast.success(t('admin.settings.fields.logoUploadedSuccess'));
      }
    } catch {
      toast.error(t('admin.settings.fields.logoUploadError'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setValue('logo_url', '', { shouldDirty: true });
  };

  const onSubmit = async (values: SiteSettingsFormValues) => {
    const { error } = await updateSettings({
      business_name: values.business_name,
      tagline: values.tagline,
      phone: values.phone,
      whatsapp: values.whatsapp,
      email: values.email,
      address: values.address,
      maps_embed_url: values.maps_embed_url,
      working_hours: values.working_hours,
      logo_url: values.logo_url,
      print_logo_url: values.print_logo_url || null,
      favicon_url: values.favicon_url,
      facebook_url: values.facebook_url,
      instagram_url: values.instagram_url,
      youtube_url: values.youtube_url,
      tiktok_url: values.tiktok_url,
      announcement: values.announcement,
      announcement_enabled: values.announcement_enabled,
      hero_image_url: values.hero_image_url,
      about_image_url: values.about_image_url,
      cta_banner_url: values.cta_banner_url,
      og_image_url: values.og_image_url,
      about_title: values.about_title,
      about_body: values.about_body,
      demo_mode: values.demo_mode,
    });

    if (error) {
      toast.error(t('admin.settings.saveError'));
      return;
    }

    reset(values);
    toast.success(t('admin.settings.savedSuccess'));
  };

  return (
    <div className="space-y-8 text-start pb-16">
      <Seo title={t('admin.settings.seoTitle')} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-white heading-accent mb-3">
            {t('admin.settings.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('admin.settings.subtitle')}</p>
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
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? t('admin.settings.saving') : t('admin.settings.saveButton')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
        {/* 1. BUSINESS IDENTITY & CONTACT */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
            <Globe className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.settings.sections.business')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label={t('admin.settings.fields.businessName')}
              error={errors.business_name?.message}
              {...register('business_name')}
            />

            <Input
              label={t('admin.settings.fields.email')}
              type="email"
              placeholder="contact@pakautoworks.pk"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label={t('admin.settings.fields.phone')}
              type="tel"
              placeholder="03126776844"
              hint={t('auth.phoneHint')}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label={t('admin.settings.fields.whatsapp')}
              type="tel"
              placeholder="03126776844"
              hint={t('auth.phoneHint')}
              error={errors.whatsapp?.message}
              {...register('whatsapp')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <Input
              label={t('admin.settings.fields.taglineEn')}
              error={errors.tagline?.en?.message}
              {...register('tagline.en')}
            />
            <Input
              label={t('admin.settings.fields.taglineUr')}
              dir="rtl"
              error={errors.tagline?.ur?.message}
              {...register('tagline.ur')}
            />
            <Input
              label={t('admin.settings.fields.taglineRoman')}
              error={errors.tagline?.['ur-roman']?.message}
              {...register('tagline.ur-roman')}
            />
          </div>
        </Card>

        {/* 2. LOGO & BRANDING ASSETS */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
            <ImageIcon className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.settings.sections.branding')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#F5F6F8]">
                {t('admin.settings.fields.logoUpload')}
              </label>
              <p className="text-xs text-[#8A93A3]">
                {t('admin.settings.fields.logoHint')}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4 text-[#FF6A00]" />}
                >
                  {uploadingLogo
                    ? t('admin.settings.fields.uploadingLogo')
                    : t('admin.settings.fields.uploadLogoBtn')}
                </Button>

                {watchedLogoUrl && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleRemoveLogo}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    {t('admin.settings.fields.removeLogoBtn')}
                  </Button>
                )}
              </div>

              {watchedLogoUrl && (
                <div className="mt-3 p-4 rounded-md bg-[#0E1013] border border-white/15 inline-block">
                  <img
                    src={watchedLogoUrl}
                    alt="Logo preview"
                    referrerPolicy="no-referrer"
                    className="h-14 w-auto object-contain"
                  />
                </div>
              )}
            </div>

            <ImageField
              label={t(
                'admin.settings.fields.printLogo',
                'Logo for print/invoices (dark text, transparent)'
              )}
              hint={t(
                'admin.settings.fields.printLogoHint',
                'Optimized for white paper printing on invoices, order receipts, and payment slips.'
              )}
              value={watchedPrintLogoUrl}
              onChange={(url) =>
                setValue('print_logo_url', url, { shouldDirty: true })
              }
              folderPrefix="site"
              error={errors.print_logo_url?.message}
            />

            <Input
              label={t('admin.settings.fields.faviconUrl')}
              placeholder="https://example.com/favicon.png"
              error={errors.favicon_url?.message}
              {...register('favicon_url')}
            />
          </div>
        </Card>

        {/* 3. IMAGES & ABOUT PAGE CONTENT (Phase 2 Addition) */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
            <FileText className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.settings.sections.imagesAbout')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageField
              label={t('admin.settings.fields.heroImage')}
              hint={t('admin.settings.fields.heroImageHint')}
              value={watchedHeroImageUrl}
              onChange={(url) =>
                setValue('hero_image_url', url, { shouldDirty: true })
              }
              folderPrefix="site"
              error={errors.hero_image_url?.message}
            />

            <ImageField
              label={t('admin.settings.fields.aboutImage')}
              hint={t('admin.settings.fields.aboutImageHint')}
              value={watchedAboutImageUrl}
              onChange={(url) =>
                setValue('about_image_url', url, { shouldDirty: true })
              }
              folderPrefix="site"
              error={errors.about_image_url?.message}
            />

            <ImageField
              label={t('admin.settings.fields.ctaBannerImage')}
              hint={t('admin.settings.fields.ctaBannerImageHint')}
              value={watchedCtaBannerUrl}
              onChange={(url) =>
                setValue('cta_banner_url', url, { shouldDirty: true })
              }
              folderPrefix="site"
              error={errors.cta_banner_url?.message}
            />

            <ImageField
              label={t('admin.settings.fields.ogImage')}
              hint={t('admin.settings.fields.ogImageHint')}
              value={watchedOgImageUrl}
              onChange={(url) =>
                setValue('og_image_url', url, { shouldDirty: true })
              }
              folderPrefix="site"
              error={errors.og_image_url?.message}
            />
          </div>

          <div className="space-y-5 pt-4 border-t border-white/10">
            <TranslatableField
              label={t('admin.settings.fields.aboutTitle')}
              value={watchedAboutTitle}
              onChange={(next) =>
                setValue(
                  'about_title',
                  {
                    en: next.en ?? '',
                    ur: next.ur ?? '',
                    'ur-roman': next['ur-roman'] ?? '',
                  },
                  { shouldDirty: true }
                )
              }
            />

            <TranslatableField
              multiline
              rows={6}
              label={t('admin.settings.fields.aboutBody')}
              value={watchedAboutBody}
              onChange={(next) =>
                setValue(
                  'about_body',
                  {
                    en: next.en ?? '',
                    ur: next.ur ?? '',
                    'ur-roman': next['ur-roman'] ?? '',
                  },
                  { shouldDirty: true }
                )
              }
            />
          </div>
        </Card>

        {/* 4. ADDRESS & GOOGLE MAPS */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
            <MapPin className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.settings.sections.addressMap')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Textarea
              label={t('admin.settings.fields.addressEn')}
              rows={2}
              error={errors.address?.en?.message}
              {...register('address.en')}
            />
            <Textarea
              label={t('admin.settings.fields.addressUr')}
              dir="rtl"
              rows={2}
              error={errors.address?.ur?.message}
              {...register('address.ur')}
            />
            <Textarea
              label={t('admin.settings.fields.addressRoman')}
              rows={2}
              error={errors.address?.['ur-roman']?.message}
              {...register('address.ur-roman')}
            />
          </div>

          <Input
            label={t('admin.settings.fields.mapsEmbedUrl')}
            placeholder="https://www.google.com/maps/embed?pb=..."
            hint={t('admin.settings.fields.mapsEmbedHint')}
            error={errors.maps_embed_url?.message}
            {...register('maps_embed_url')}
          />
        </Card>

        {/* 5. WORKING HOURS (STRUCTURED PER WEEKDAY) */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
            <Clock className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.settings.sections.workingHours')}
            </h2>
          </div>

          <div className="space-y-3">
            {WEEKDAY_KEYS.map((day) => {
              const isOpen = watchedWorkingHours?.[day]?.isOpen ?? false;
              return (
                <div
                  key={day}
                  className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 p-3.5 rounded-md bg-[#0E1013] border border-white/10"
                >
                  <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-3">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#FF6A00] rounded cursor-pointer"
                        {...register(`working_hours.${day}.isOpen`)}
                      />
                      <span className="text-sm font-semibold text-white">
                        {t(`admin.settings.weekdays.${day}`)}
                      </span>
                    </label>
                    <span className="text-xs text-[#8A93A3]">
                      {isOpen
                        ? t('admin.settings.fields.dayOpen')
                        : t('admin.settings.fields.dayClosed')}
                    </span>
                  </div>

                  {isOpen ? (
                    <div className="sm:col-span-8 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8A93A3] shrink-0">
                          {t('admin.settings.fields.openTime')}:
                        </span>
                        <input
                          type="time"
                          dir="ltr"
                          className="w-full rounded bg-[#1B1F26] border border-white/15 px-2.5 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                          {...register(`working_hours.${day}.openTime`)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8A93A3] shrink-0">
                          {t('admin.settings.fields.closeTime')}:
                        </span>
                        <input
                          type="time"
                          dir="ltr"
                          className="w-full rounded bg-[#1B1F26] border border-white/15 px-2.5 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                          {...register(`working_hours.${day}.closeTime`)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="sm:col-span-8 text-xs text-[#8A93A3]">
                      {t('admin.settings.fields.dayClosed')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* 6. SOCIAL MEDIA LINKS */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
            <Share2 className="w-5 h-5 text-[#FF6A00]" />
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.settings.sections.social')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label={t('admin.settings.fields.facebookUrl')}
              placeholder="https://facebook.com/..."
              error={errors.facebook_url?.message}
              {...register('facebook_url')}
            />
            <Input
              label={t('admin.settings.fields.instagramUrl')}
              placeholder="https://instagram.com/..."
              error={errors.instagram_url?.message}
              {...register('instagram_url')}
            />
            <Input
              label={t('admin.settings.fields.youtubeUrl')}
              placeholder="https://youtube.com/..."
              error={errors.youtube_url?.message}
              {...register('youtube_url')}
            />
            <Input
              label={t('admin.settings.fields.tiktokUrl')}
              placeholder="https://tiktok.com/@..."
              error={errors.tiktok_url?.message}
              {...register('tiktok_url')}
            />
          </div>
        </Card>

        {/* 7. PUBLIC ANNOUNCEMENT BANNER */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-5 h-5 text-[#FF6A00]" />
              <h2 className="text-xl font-bold font-heading text-white">
                {t('admin.settings.sections.announcement')}
              </h2>
            </div>

            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#FF6A00] rounded cursor-pointer"
                {...register('announcement_enabled')}
              />
              <span className="text-sm font-semibold text-white">
                {t('admin.settings.fields.announcementEnabled')}
              </span>
            </label>
          </div>

          <div
            className={
              watchedAnnouncementEnabled
                ? 'grid grid-cols-1 md:grid-cols-3 gap-5'
                : 'grid grid-cols-1 md:grid-cols-3 gap-5 opacity-60'
            }
          >
            <Input
              label={t('admin.settings.fields.announcementEn')}
              error={errors.announcement?.en?.message}
              {...register('announcement.en')}
            />
            <Input
              label={t('admin.settings.fields.announcementUr')}
              dir="rtl"
              error={errors.announcement?.ur?.message}
              {...register('announcement.ur')}
            />
            <Input
              label={t('admin.settings.fields.announcementRoman')}
              error={errors.announcement?.['ur-roman']?.message}
              {...register('announcement.ur-roman')}
            />
          </div>
        </Card>

        {/* 8. DEMO MODE & SAMPLE DATA */}
        <Card className="p-6 sm:p-8 space-y-4 border-[#FFC21A]/30">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-5 h-5 text-[#FFC21A]" />
              <h2 className="text-xl font-bold font-heading text-white">
                {t('demo.settingsSectionTitle')}
              </h2>
            </div>

            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#FF6A00] rounded cursor-pointer"
                {...register('demo_mode')}
              />
              <span className="text-sm font-semibold text-white">
                {t('demo.enableBannerToggle')}
              </span>
            </label>
          </div>

          <p className="text-xs sm:text-sm text-[#8A93A3] leading-relaxed">
            {t('demo.settingsSectionDescription')}
          </p>

          <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 text-xs text-[#F5F6F8] space-y-1.5">
            <p className="font-semibold text-[#FFC21A]">
              {t('demo.removeScriptHintTitle')}
            </p>
            <p className="text-[#8A93A3]">
              {t('demo.removeScriptHintBody')}
            </p>
          </div>
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? t('admin.settings.saving') : t('admin.settings.saveButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
