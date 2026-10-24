import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarCheck,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  FlaskConical,
  History,
  MessageCircle,
  PauseCircle,
  Phone,
  Search,
  ShoppingBag,
  Wrench,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { normalizePakPhoneInput, PAK_MOBILE_REGEX } from '../../lib/validators';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { useSiteSettings } from '../settings/useSiteSettings';
import { BookingStatusLookup } from '../booking/BookingStatusLookup';
import { OrderStatusLookup } from '../orders/OrderStatusLookup';
import {
  DEMO_JOB_SAMPLES,
  FORWARD_JOB_STAGES,
  formatKarachiDateTime,
  formatPKR,
  getInvoiceStatusBadgeVariant,
  getJobStageRank,
  getJobStatusBadgeVariant,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import type { JobLookupResponse } from '../../types/database';
import { Badge, Button, Card, Input } from '../../components/ui';
import { PageHeader } from '../../components/common/PageHeader';
import { Seo } from '../../components/common/Seo';
import { cn } from '../../lib/utils';

export default function TrackPage() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab: 'job' | 'booking' | 'order' =
    searchParams.get('tab') === 'booking'
      ? 'booking'
      : searchParams.get('tab') === 'order' ||
          Boolean(searchParams.get('order') || searchParams.get('order_no'))
        ? 'order'
        : 'job';
  const [activeTab, setActiveTab] = useState<'job' | 'booking' | 'order'>(
    initialTab
  );

  const [jobNo, setJobNo] = useState<string>(
    searchParams.get('job') || searchParams.get('job_no') || ''
  );
  const [phone, setPhone] = useState<string>(searchParams.get('phone') || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<JobLookupResponse | null>(null);
  const [cooldownSec, setCooldownSec] = useState<number>(0);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSec]);

  const performLookup = useCallback(
    async (rawJobNo: string, rawPhone: string) => {
      const cleanNo = rawJobNo.trim().toUpperCase();
      const cleanPhone = normalizePakPhoneInput(rawPhone);

      if (!cleanNo || !PAK_MOBILE_REGEX.test(cleanPhone)) {
        setErrorMsg(t('track.jobLookup.errors.notFound'));
        setResult(null);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const { data, error } = await supabase.rpc('lookup_job_status', {
          p_job_no: cleanNo,
          p_phone: cleanPhone,
        });

        if (error) {
          if (isMissingDatabaseObjectsError(error)) {
            setErrorMsg(t('track.jobLookup.errors.schemaMissing'));
          } else if ((error.message || '').includes('rate_limited')) {
            setErrorMsg(t('track.jobLookup.errors.rateLimited'));
          } else {
            setErrorMsg(t('track.jobLookup.errors.notFound'));
          }
          setResult(null);
          return;
        }

        if (!data) {
          setErrorMsg(t('track.jobLookup.errors.notFound'));
          setResult(null);
          return;
        }

        setResult(data as unknown as JobLookupResponse);
        setCooldownSec(2);
      } catch {
        setErrorMsg(t('track.jobLookup.errors.notFound'));
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Auto-run if both job and phone are in URL query params on mount
  useEffect(() => {
    const qJob = searchParams.get('job') || searchParams.get('job_no');
    const qPhone = searchParams.get('phone');
    if (qJob && qPhone) {
      void performLookup(qJob, qPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSec > 0) return;
    void performLookup(jobNo, phone);
  };

  const handleSelectSample = (sampleJobNo: string, samplePhone: string) => {
    setJobNo(sampleJobNo);
    setPhone(samplePhone);
    setSearchParams({ job: sampleJobNo });
    void performLookup(sampleJobNo, samplePhone);
  };

  const workshopPhone = settings.phone || '03126776844';
  const workshopWhatsapp = settings.whatsapp || workshopPhone;

  const currentStageRank = result ? getJobStageRank(result.status) : null;
  const itemsTotal = result?.show_cost_to_customer
    ? (result.items ?? []).reduce(
        (sum, item) => sum + Number(item.line_total ?? 0),
        0
      )
    : 0;

  return (
    <div>
      <Seo
        title={t('track.seoTitle')}
        description={t('track.seoDescription')}
        canonicalPath="/track"
      />

      <PageHeader
        title={t('track.pageTitle')}
        subtitle={t('track.pageSubtitle')}
        breadcrumbs={[{ label: t('nav.trackJob') }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8 text-start">
        {/* Top Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
              activeTab === 'job'
                ? 'bg-[#FF6A00] text-white'
                : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
            )}
          >
            <Wrench className="w-4 h-4" />
            <span>{t('track.tabs.job')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('booking')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
              activeTab === 'booking'
                ? 'bg-[#FF6A00] text-white'
                : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
            )}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t('track.tabs.booking')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
              activeTab === 'order'
                ? 'bg-[#FF6A00] text-white'
                : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('track.tabs.order')}</span>
          </button>
        </div>

        {activeTab === 'booking' ? (
          <BookingStatusLookup />
        ) : activeTab === 'order' ? (
          <OrderStatusLookup />
        ) : (
          <div className="space-y-8">
            {/* Search Card */}
            <Card className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-white mb-1">
                  {t('track.jobLookup.title')}
                </h2>
                <p className="text-sm text-[#8A93A3]">
                  {t('track.jobLookup.subtitle')}
                </p>
              </div>

              {/* Demo Mode Sample Chips — rendered ONLY when site_settings.demo_mode is true */}
              {settings.demo_mode && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <FlaskConical className="w-4 h-4 text-[#FFC21A] shrink-0" />
                    <span>{t('track.jobLookup.demoSamplesTitle')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_JOB_SAMPLES.map((sample) => (
                      <button
                        key={sample.jobNo}
                        type="button"
                        onClick={() =>
                          handleSelectSample(sample.jobNo, sample.phone)
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-[#0E1013] hover:bg-[#2A2F38] border border-amber-500/30 hover:border-[#FFC21A] px-3 py-1.5 text-xs text-[#F5F6F8] transition-colors cursor-pointer"
                      >
                        <span
                          dir="ltr"
                          className="font-mono font-bold text-[#FFC21A]"
                        >
                          {sample.jobNo}
                        </span>
                        <span className="text-[#8A93A3]">•</span>
                        <span>{sample.vehicle}</span>
                        <Badge variant={getJobStatusBadgeVariant(sample.status)}>
                          {t(`jobs.statuses.${sample.status}`)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
              >
                <div className="sm:col-span-5">
                  <Input
                    label={t('track.jobLookup.jobNoLabel')}
                    dir="ltr"
                    placeholder={t('track.jobLookup.jobNoPlaceholder')}
                    value={jobNo}
                    onChange={(e) => setJobNo(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="sm:col-span-5">
                  <Input
                    label={t('track.jobLookup.phoneLabel')}
                    dir="ltr"
                    type="tel"
                    placeholder={t('track.jobLookup.phonePlaceholder')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loading || cooldownSec > 0}
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    {loading
                      ? t('track.jobLookup.searching')
                      : t('track.jobLookup.searchBtn')}
                  </Button>
                </div>
              </form>

              {cooldownSec > 0 && (
                <p className="text-xs text-[#8A93A3]">
                  {t('track.jobLookup.cooldownNote', { seconds: cooldownSec })}
                </p>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-md bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3 text-sm text-red-200"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </Card>

            {/* Job Lookup Result */}
            {result && (
              <div className="space-y-6">
                {/* Top Summary Banner & Stage Stepper */}
                <Card className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          dir="ltr"
                          className="text-2xl sm:text-3xl font-bold font-mono text-[#FFC21A]"
                        >
                          {result.job_no}
                        </span>
                        <Badge variant={getJobStatusBadgeVariant(result.status)}>
                          {t(`jobs.statuses.${result.status}`)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[#F5F6F8]">
                        <Car className="w-4 h-4 text-[#FF6A00]" />
                        <span className="font-semibold">
                          {result.vehicle_summary}
                        </span>
                        {result.plate_masked && (
                          <span
                            dir="ltr"
                            className="rounded bg-[#2A2F38] border border-white/15 px-2 py-0.5 text-xs font-mono text-[#FFC21A]"
                          >
                            {result.plate_masked}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={buildWhatsAppUrl(
                          workshopWhatsapp,
                          t('track.jobLookup.whatsappPrefill', {
                            jobNo: result.job_no,
                            vehicle: result.vehicle_summary,
                          })
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          leftIcon={
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                          }
                        >
                          {t('track.jobLookup.whatsappBtn', {
                            jobNo: result.job_no,
                          })}
                        </Button>
                      </a>
                      <a href={`tel:${workshopPhone}`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<Phone className="w-4 h-4 text-[#FF6A00]" />}
                        >
                          {t('track.jobLookup.callBtn')}
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Special Banner for ON_HOLD or CANCELLED */}
                  {result.status === 'on_hold' && (
                    <div className="rounded-lg bg-amber-500/15 border border-amber-500/40 p-4 flex items-start gap-3">
                      <PauseCircle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-amber-200">
                          {t('track.jobLookup.onHoldBannerTitle')}
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
                          {t('track.jobLookup.onHoldBannerDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.status === 'cancelled' && (
                    <div className="rounded-lg bg-red-500/15 border border-red-500/40 p-4 flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-red-200">
                          {t('track.jobLookup.cancelledBannerTitle')}
                        </h3>
                        <p className="text-xs sm:text-sm text-red-100/90 mt-1">
                          {t('track.jobLookup.cancelledBannerDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 7-Stage Repair Progress Bar */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A93A3]">
                      {t('track.jobLookup.stageProgressTitle')}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {FORWARD_JOB_STAGES.map((stage, idx) => {
                        const rank = idx + 1;
                        const isCompleted =
                          currentStageRank !== null && rank < currentStageRank;
                        const isCurrent =
                          currentStageRank !== null && rank === currentStageRank;

                        return (
                          <div
                            key={stage}
                            className={cn(
                              'rounded-md border p-3 flex flex-col justify-between transition-colors',
                              isCurrent
                                ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white'
                                : isCompleted
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                  : 'bg-[#0E1013] border-white/10 text-[#8A93A3]'
                            )}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span
                                dir="ltr"
                                className="text-[11px] font-mono font-bold"
                              >
                                0{rank}
                              </span>
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : isCurrent ? (
                                <Wrench className="w-4 h-4 text-[#FF6A00] shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 opacity-40 shrink-0" />
                              )}
                            </div>
                            <span className="text-xs font-semibold leading-snug">
                              {t(`jobs.statuses.${stage}`)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Latest Advisor Update (public_note) */}
                  {result.public_note && (
                    <div className="rounded-lg bg-[#0E1013] border border-[#FF6A00]/40 p-4 space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] block">
                        {t('track.jobLookup.publicNoteTitle')}
                      </span>
                      <p className="text-sm text-white leading-relaxed">
                        {result.public_note}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Vehicle Summary & Work Items Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Vehicle & Check-In Summary */}
                  <Card className="lg:col-span-5 p-6 space-y-4">
                    <h3 className="text-base font-bold font-heading text-white flex items-center gap-2 border-b border-white/10 pb-3">
                      <Car className="w-4 h-4 text-[#FF6A00]" />
                      <span>{t('track.jobLookup.vehicleCardTitle')}</span>
                    </h3>

                    <dl className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <dt className="text-xs text-[#8A93A3]">
                          {t('track.jobLookup.plateLabel')}
                        </dt>
                        <dd
                          dir="ltr"
                          className="font-mono font-semibold text-white mt-0.5"
                        >
                          {result.plate_masked || '—'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-[#8A93A3]">
                          {t('track.jobLookup.mileageLabel')}
                        </dt>
                        <dd dir="ltr" className="font-semibold text-white mt-0.5">
                          {result.mileage_in != null
                            ? `${result.mileage_in.toLocaleString()} km`
                            : '—'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-[#8A93A3]">
                          {t('track.jobLookup.receivedAtLabel')}
                        </dt>
                        <dd dir="ltr" className="text-white mt-0.5">
                          {formatKarachiDateTime(result.received_at)}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-[#8A93A3]">
                          {t('track.jobLookup.etaLabel')}
                        </dt>
                        <dd dir="ltr" className="text-white mt-0.5">
                          {result.estimated_completion ||
                            t('track.jobLookup.etaPending')}
                        </dd>
                      </div>

                      {result.delivered_at && (
                        <div className="col-span-2">
                          <dt className="text-xs text-[#8A93A3]">
                            {t('track.jobLookup.deliveredAtLabel')}
                          </dt>
                          <dd dir="ltr" className="text-emerald-300 mt-0.5">
                            {formatKarachiDateTime(result.delivered_at)}
                          </dd>
                        </div>
                      )}

                      <div className="col-span-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <dt className="text-xs text-[#8A93A3] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>{t('track.jobLookup.invoiceStatusLabel')}</span>
                        </dt>
                        <dd>
                          {result.invoice_status ? (
                            <Badge
                              variant={getInvoiceStatusBadgeVariant(
                                result.invoice_status
                              )}
                            >
                              {t(`invoices.statuses.${result.invoice_status}`)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-[#8A93A3]">
                              {t('track.jobLookup.noInvoiceYet')}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>

                    {result.complaint && (
                      <div className="pt-3 border-t border-white/10">
                        <span className="text-xs text-[#8A93A3] block mb-1">
                          {t('track.jobLookup.complaintLabel')}
                        </span>
                        <p className="text-xs sm:text-sm text-[#F5F6F8] bg-[#0E1013] rounded p-3 border border-white/10">
                          {result.complaint}
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Right: Recorded Work Items */}
                  <Card className="lg:col-span-7 p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#FF6A00]" />
                        <span>{t('track.jobLookup.workItemsTitle')}</span>
                      </h3>
                      {!result.show_cost_to_customer && (
                        <span className="text-xs text-[#8A93A3]">
                          {t('track.jobLookup.costsHiddenHint')}
                        </span>
                      )}
                    </div>

                    {!result.items || result.items.length === 0 ? (
                      <p className="text-xs sm:text-sm text-[#8A93A3] py-4">
                        {t('track.jobLookup.workItemsEmpty')}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm text-start">
                          <thead>
                            <tr className="border-b border-white/10 text-[#8A93A3]">
                              <th className="py-2 pe-3 font-medium text-start">
                                {t('invoices.print.colType')}
                              </th>
                              <th className="py-2 px-3 font-medium text-start">
                                {t('invoices.print.colDescription')}
                              </th>
                              <th className="py-2 px-3 font-medium text-end">
                                {t('invoices.print.colQty')}
                              </th>
                              {result.show_cost_to_customer && (
                                <>
                                  <th className="py-2 px-3 font-medium text-end">
                                    {t('invoices.print.colUnitPrice')}
                                  </th>
                                  <th className="py-2 ps-3 font-medium text-end">
                                    {t('invoices.print.colLineTotal')}
                                  </th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {result.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-2.5 pe-3 whitespace-nowrap">
                                  <Badge variant="neutral">
                                    {t(`jobs.itemTypes.${item.item_type}`)}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-white font-medium">
                                  {item.description}
                                </td>
                                <td
                                  dir="ltr"
                                  className="py-2.5 px-3 text-end tabular-nums text-[#F5F6F8]"
                                >
                                  {item.quantity}
                                </td>
                                {result.show_cost_to_customer && (
                                  <>
                                    <td
                                      dir="ltr"
                                      className="py-2.5 px-3 text-end tabular-nums text-[#8A93A3]"
                                    >
                                      {formatPKR(item.unit_price)}
                                    </td>
                                    <td
                                      dir="ltr"
                                      className="py-2.5 ps-3 text-end tabular-nums font-semibold text-white"
                                    >
                                      {formatPKR(item.line_total)}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          {result.show_cost_to_customer && (
                            <tfoot>
                              <tr className="border-t border-white/20">
                                <td
                                  colSpan={4}
                                  className="pt-3 text-end font-semibold text-[#8A93A3]"
                                >
                                  {t('track.jobLookup.estimatedTotalLabel')}:
                                </td>
                                <td
                                  dir="ltr"
                                  className="pt-3 ps-3 text-end font-bold text-base text-[#FFC21A] tabular-nums"
                                >
                                  {formatPKR(itemsTotal)}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Progress Notes & Stage Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer-Visible Progress Notes */}
                  <Card className="p-6 space-y-4">
                    <h3 className="text-base font-bold font-heading text-white flex items-center gap-2 border-b border-white/10 pb-3">
                      <MessageCircle className="w-4 h-4 text-[#FF6A00]" />
                      <span>{t('track.jobLookup.notesTimelineTitle')}</span>
                    </h3>

                    {!result.notes || result.notes.length === 0 ? (
                      <p className="text-xs text-[#8A93A3] py-2">—</p>
                    ) : (
                      <div className="space-y-3">
                        {result.notes.map((n, idx) => (
                          <div
                            key={idx}
                            className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 space-y-1.5"
                          >
                            <p className="text-xs sm:text-sm text-white leading-relaxed">
                              {n.note}
                            </p>
                            <span
                              dir="ltr"
                              className="text-[11px] text-[#8A93A3] block"
                            >
                              {formatKarachiDateTime(n.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Stage History Timeline */}
                  <Card className="p-6 space-y-4">
                    <h3 className="text-base font-bold font-heading text-white flex items-center gap-2 border-b border-white/10 pb-3">
                      <History className="w-4 h-4 text-[#FF6A00]" />
                      <span>{t('track.jobLookup.statusTimelineTitle')}</span>
                    </h3>

                    {!result.history || result.history.length === 0 ? (
                      <p className="text-xs text-[#8A93A3] py-2">—</p>
                    ) : (
                      <div className="space-y-3">
                        {result.history.map((h, idx) => (
                          <div
                            key={idx}
                            className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 flex flex-col gap-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Badge
                                variant={getJobStatusBadgeVariant(h.to_status)}
                              >
                                {t(`jobs.statuses.${h.to_status}`)}
                              </Badge>
                              <span
                                dir="ltr"
                                className="text-[11px] text-[#8A93A3]"
                              >
                                {formatKarachiDateTime(h.created_at)}
                              </span>
                            </div>
                            {h.note && (
                              <p className="text-xs text-[#F5F6F8]/90">
                                {h.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
