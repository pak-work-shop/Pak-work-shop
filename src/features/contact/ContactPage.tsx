import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { useSiteSettings } from '../settings/useSiteSettings';
import { WEEKDAY_KEYS } from '../settings/SiteSettingsContext';
import { getLocalized, normalizeLangCode } from '../../i18n/helpers';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import {
  createContactFormSchema,
  type ContactFormValues,
} from '../../lib/validators';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { Button, Input, Textarea } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { JsonLd, buildLocalBusinessJsonLd } from '../../components/common/JsonLd';

const COOLDOWN_SECONDS = 60;

export function isValidGoogleMapsEmbedUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('https://www.google.com/maps/embed');
}

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [serverErrorKey, setServerErrorKey] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const phone = settings.phone?.trim() || '03126776844';
  const whatsapp = settings.whatsapp?.trim() || phone;
  const email = settings.email?.trim() || '';
  const address = getLocalized(settings, 'address', i18n.language);
  const whatsappHref = buildWhatsAppUrl(whatsapp, t('whatsapp.defaultMessage'));

  const openDays = WEEKDAY_KEYS.filter(
    (day) => settings.working_hours && settings.working_hours[day]?.isOpen
  );

  const mapsEmbedUrl = settings.maps_embed_url?.trim() || '';
  const showMap = isValidGoogleMapsEmbedUrl(mapsEmbedUrl);

  const schema = createContactFormSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      subject: '',
      message: '',
      honeypot: '',
    },
  });

  // Countdown timer for client-side cooldown after successful submission
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const onSubmit = async (values: ContactFormValues) => {
    setServerErrorKey(null);

    // Honeypot check: if filled by a bot, silently pretend success and do not submit
    if (values.honeypot && values.honeypot.trim().length > 0) {
      setSubmittedSuccess(true);
      reset();
      return;
    }

    if (cooldownRemaining > 0) {
      toast.error(t('contact.form.cooldownNote', { seconds: cooldownRemaining }));
      return;
    }

    if (!env.isConfigured) {
      setServerErrorKey('contact.form.errors.network');
      return;
    }

    try {
      const { error } = await supabase.rpc('submit_contact_message', {
        p_name: values.name,
        p_phone: values.phone,
        p_email: values.email || null,
        p_subject: values.subject || null,
        p_message: values.message,
        p_language: normalizeLangCode(i18n.language),
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('rate_limited')) {
          setServerErrorKey('contact.form.errors.rate_limited');
          toast.error(t('contact.form.errors.rate_limited'));
        } else if (msg.includes('invalid_input')) {
          setServerErrorKey('contact.form.errors.invalid_input');
          toast.error(t('contact.form.errors.invalid_input'));
        } else if (msg.includes('fetch') || msg.includes('network')) {
          setServerErrorKey('contact.form.errors.network');
          toast.error(t('contact.form.errors.network'));
        } else {
          setServerErrorKey('contact.form.errors.generic');
          toast.error(t('contact.form.errors.generic'));
        }
        return;
      }

      setSubmittedSuccess(true);
      setCooldownRemaining(COOLDOWN_SECONDS);
      reset();
      toast.success(t('contact.form.successTitle'));
    } catch {
      setServerErrorKey('contact.form.errors.network');
      toast.error(t('contact.form.errors.network'));
    }
  };

  const localBusinessJsonLd = buildLocalBusinessJsonLd(settings, i18n.language);

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo
        title={t('contact.seoTitle')}
        description={t('contact.seoDescription')}
        canonicalPath="/contact"
      />
      <JsonLd data={localBusinessJsonLd} />

      <PageHeader
        title={t('contact.pageTitle')}
        subtitle={t('contact.pageSubtitle')}
        breadcrumbs={[{ label: t('nav.contact') }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Contact Info Cards (Hides anything not set) */}
          <div className="lg:col-span-5 space-y-4 text-start">
            {/* Phone Card */}
            <a
              href={`tel:${phone}`}
              className="block rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] p-5 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">
                    {t('contact.cards.phoneTitle')}
                  </span>
                  <span
                    dir="ltr"
                    className="text-lg font-bold font-heading text-[#12151A] tabular-nums"
                  >
                    {phone}
                  </span>
                  <span className="text-xs text-[#FF6A00] font-semibold block mt-0.5">
                    {t('contact.cards.phoneAction')}
                  </span>
                </div>
              </div>
            </a>

            {/* WhatsApp Card */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg bg-white border border-slate-200 hover:border-emerald-500 p-5 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">
                    {t('contact.cards.whatsappTitle')}
                  </span>
                  <span
                    dir="ltr"
                    className="text-lg font-bold font-heading text-[#12151A] tabular-nums"
                  >
                    {whatsapp}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                    {t('contact.cards.whatsappAction')}
                  </span>
                </div>
              </div>
            </a>

            {/* Email Card (Shown ONLY if set in site_settings) */}
            {email && (
              <a
                href={`mailto:${email}`}
                className="block rounded-lg bg-white border border-slate-200 hover:border-[#FF6A00] p-5 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-500 block">
                      {t('contact.cards.emailTitle')}
                    </span>
                    <span className="text-sm font-semibold text-[#12151A] break-all">
                      {email}
                    </span>
                  </div>
                </div>
              </a>
            )}

            {/* Address Card (Shown ONLY if set in site_settings) */}
            {address && (
              <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">
                      {t('contact.cards.addressTitle')}
                    </span>
                    <p className="text-sm text-[#12151A] leading-relaxed mt-1">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Working Hours Card (Shown ONLY if open days exist in site_settings) */}
            {openDays.length > 0 && (
              <div className="rounded-lg bg-white border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#0E1013] text-[#FF6A00] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold font-heading text-[#12151A]">
                    {t('contact.cards.hoursTitle')}
                  </h2>
                </div>

                <ul className="space-y-1.5 text-sm pt-2 border-t border-slate-100">
                  {WEEKDAY_KEYS.map((day) => {
                    const entry = settings.working_hours[day];
                    const isOpen = Boolean(entry?.isOpen);
                    return (
                      <li
                        key={day}
                        className="flex items-center justify-between gap-2 py-0.5"
                      >
                        <span className="text-slate-600">
                          {t(`admin.settings.weekdays.${day}`)}
                        </span>
                        {isOpen && entry ? (
                          <span
                            dir="ltr"
                            className="font-semibold text-[#12151A] tabular-nums"
                          >
                            {entry.openTime} – {entry.closeTime}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {t('footer.closed')}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Spam-Protected Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-lg bg-white border border-slate-200 p-6 sm:p-8 shadow-xs text-start space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-heading text-[#12151A]">
                  {t('contact.form.title')}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {t('contact.form.subtitle')}
                </p>
              </div>

              {submittedSuccess ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 space-y-4">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <h3 className="text-lg font-bold font-heading">
                      {t('contact.form.successTitle')}
                    </h3>
                  </div>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    {t('contact.form.successMessage')}
                  </p>
                  {cooldownRemaining > 0 && (
                    <p className="text-xs text-emerald-700/80">
                      {t('contact.form.cooldownNote', {
                        seconds: cooldownRemaining,
                      })}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={cooldownRemaining > 0}
                    onClick={() => setSubmittedSuccess(false)}
                  >
                    {t('contact.form.sendAnotherBtn')}
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="space-y-5"
                >
                  {/* Hidden Honeypot Input for Bot Filtering */}
                  <div
                    className="hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="website_url_hp">Website</label>
                    <input
                      id="website_url_hp"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register('honeypot')}
                    />
                  </div>

                  {serverErrorKey && (
                    <div
                      role="alert"
                      className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-xs sm:text-sm text-red-700"
                    >
                      {t(serverErrorKey)}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      lightMode
                      label={t('contact.form.nameLabel')}
                      placeholder={t('contact.form.namePlaceholder')}
                      error={errors.name?.message}
                      {...register('name')}
                    />

                    <Input
                      lightMode
                      type="tel"
                      label={t('contact.form.phoneLabel')}
                      placeholder={t('contact.form.phonePlaceholder')}
                      hint={t('auth.phoneHint')}
                      error={errors.phone?.message}
                      {...register('phone')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      lightMode
                      type="email"
                      label={t('contact.form.emailLabel')}
                      placeholder={t('contact.form.emailPlaceholder')}
                      error={errors.email?.message}
                      {...register('email')}
                    />

                    <Input
                      lightMode
                      label={t('contact.form.subjectLabel')}
                      placeholder={t('contact.form.subjectPlaceholder')}
                      error={errors.subject?.message}
                      {...register('subject')}
                    />
                  </div>

                  <Textarea
                    lightMode
                    rows={5}
                    label={t('contact.form.messageLabel')}
                    placeholder={t('contact.form.messagePlaceholder')}
                    error={errors.message?.message}
                    {...register('message')}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={cooldownRemaining > 0}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    {isSubmitting
                      ? t('contact.form.submitting')
                      : t('contact.form.submitBtn')}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Google Maps Embed (Rendered ONLY if valid https://www.google.com/maps/embed URL is set) */}
        {showMap && (
          <section className="space-y-4 text-start">
            <h2 className="text-2xl font-bold font-heading text-[#12151A]">
              {t('contact.mapTitle')}
            </h2>
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs aspect-[16/9] max-h-[420px] w-full">
              <iframe
                src={mapsEmbedUrl}
                title={t('contact.mapTitle')}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
