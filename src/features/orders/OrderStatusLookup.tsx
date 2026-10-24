import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FlaskConical,
  History,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RotateCcw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { normalizePakPhoneInput, PAK_MOBILE_REGEX } from '../../lib/validators';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import { formatPKRPrice } from '../catalogue/useCatalogueData';
import {
  formatKarachiDateTime,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import {
  DEMO_ORDER_SAMPLES,
  FORWARD_ORDER_STAGES,
  getOrderPaymentStatusBadgeVariant,
  getOrderStageRank,
  getOrderStatusBadgeVariant,
} from './orderUtils';
import type { OrderLookupResponse } from '../../types/database';
import { Badge, Button, Card, Input } from '../../components/ui';
import { cn } from '../../lib/utils';

export function OrderStatusLookup() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const lang = i18n.language;

  const [orderNo, setOrderNo] = useState<string>(
    searchParams.get('order') || searchParams.get('order_no') || ''
  );
  const [phone, setPhone] = useState<string>(searchParams.get('phone') || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<OrderLookupResponse | null>(null);
  const [cooldownSec, setCooldownSec] = useState<number>(0);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSec]);

  const performLookup = useCallback(
    async (rawOrderNo: string, rawPhone: string) => {
      const cleanNo = rawOrderNo.trim().toUpperCase();
      const cleanPhone = normalizePakPhoneInput(rawPhone);

      if (!cleanNo || !PAK_MOBILE_REGEX.test(cleanPhone)) {
        setErrorMsg(t('track.orderLookup.errors.notFound'));
        setResult(null);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const { data, error } = await supabase.rpc('lookup_order_status', {
          p_order_no: cleanNo,
          p_phone: cleanPhone,
        });

        if (error) {
          if (isMissingDatabaseObjectsError(error)) {
            setErrorMsg(t('track.orderLookup.errors.schemaMissing'));
          } else if ((error.message || '').includes('rate_limited')) {
            setErrorMsg(t('track.orderLookup.errors.rateLimited'));
          } else {
            setErrorMsg(t('track.orderLookup.errors.notFound'));
          }
          setResult(null);
          return;
        }

        if (!data) {
          setErrorMsg(t('track.orderLookup.errors.notFound'));
          setResult(null);
          return;
        }

        setResult(data as unknown as OrderLookupResponse);
        setCooldownSec(2);
      } catch {
        setErrorMsg(t('track.orderLookup.errors.notFound'));
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    const qOrder = searchParams.get('order') || searchParams.get('order_no');
    const qPhone = searchParams.get('phone');
    if (qOrder && qPhone) {
      void performLookup(qOrder, qPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSec > 0) return;
    void performLookup(orderNo, phone);
  };

  const handleSelectSample = (sampleOrderNo: string, samplePhone: string) => {
    setOrderNo(sampleOrderNo);
    setPhone(samplePhone);
    setSearchParams({ tab: 'order', order: sampleOrderNo });
    void performLookup(sampleOrderNo, samplePhone);
  };

  const workshopPhone = settings.phone || '03126776844';
  const workshopWhatsapp = settings.whatsapp || workshopPhone;
  const currentStageRank = result ? getOrderStageRank(result.status) : null;

  return (
    <div className="space-y-8">
      {/* Search Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white mb-1">
            {t('track.orderLookup.title')}
          </h2>
          <p className="text-sm text-[#8A93A3]">
            {t('track.orderLookup.subtitle')}
          </p>
        </div>

        {/* Demo Mode Sample Chips */}
        {settings.demo_mode && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <FlaskConical className="w-4 h-4 text-[#FFC21A] shrink-0" />
              <span>{t('track.orderLookup.demoSamplesTitle')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_ORDER_SAMPLES.map((sample) => (
                <button
                  key={sample.orderNo}
                  type="button"
                  onClick={() =>
                    handleSelectSample(sample.orderNo, sample.phone)
                  }
                  className="inline-flex items-center gap-2 rounded-md bg-[#0E1013] hover:bg-[#2A2F38] border border-amber-500/30 hover:border-[#FFC21A] px-3 py-1.5 text-xs text-[#F5F6F8] transition-colors cursor-pointer"
                >
                  <span
                    dir="ltr"
                    className="font-mono font-bold text-[#FFC21A]"
                  >
                    {sample.orderNo}
                  </span>
                  <span className="text-[#8A93A3]">•</span>
                  <span>{sample.city}</span>
                  <Badge variant={getOrderStatusBadgeVariant(sample.status)}>
                    {t(`orders.statuses.${sample.status}`)}
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
              label={t('track.orderLookup.orderNoLabel')}
              dir="ltr"
              placeholder={t('track.orderLookup.orderNoPlaceholder')}
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="sm:col-span-5">
            <Input
              label={t('track.orderLookup.phoneLabel')}
              dir="ltr"
              type="tel"
              placeholder={t('track.orderLookup.phonePlaceholder')}
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
                ? t('track.orderLookup.searching')
                : t('track.orderLookup.searchBtn')}
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

      {/* Order Lookup Result */}
      {result && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            {/* Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    dir="ltr"
                    className="text-2xl sm:text-3xl font-bold font-mono text-[#FFC21A]"
                  >
                    {result.order_no}
                  </span>
                  <Badge variant={getOrderStatusBadgeVariant(result.status)}>
                    {t(`orders.statuses.${result.status}`)}
                  </Badge>
                  <Badge
                    variant={getOrderPaymentStatusBadgeVariant(
                      result.payment_status
                    )}
                  >
                    {t(`orders.paymentStatuses.${result.payment_status}`)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#8A93A3]">
                  <span className="inline-flex items-center gap-1.5 text-white font-semibold">
                    <MapPin className="w-4 h-4 text-[#FF6A00]" />
                    <span>{result.city}</span>
                  </span>
                  <span>•</span>
                  <span>
                    {t('orders.placedAt')}:{' '}
                    <strong dir="ltr" className="text-[#F5F6F8]">
                      {formatKarachiDateTime(result.placed_at)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={buildWhatsAppUrl(
                    workshopWhatsapp,
                    t('track.orderLookup.whatsappPrefill', {
                      orderNo: result.order_no,
                      city: result.city,
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
                    {t('track.orderLookup.whatsappBtn', {
                      orderNo: result.order_no,
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

            {/* Cancelled or Returned Banner */}
            {result.status === 'cancelled' && (
              <div className="rounded-lg bg-red-500/15 border border-red-500/40 p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-200">
                    {t('track.orderLookup.cancelledBannerTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-red-100/90 mt-1">
                    {t('track.orderLookup.cancelledBannerDesc')}
                  </p>
                </div>
              </div>
            )}

            {result.status === 'returned' && (
              <div className="rounded-lg bg-amber-500/15 border border-amber-500/40 p-4 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    {t('track.orderLookup.returnedBannerTitle')}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-100/90 mt-1">
                    {t('track.orderLookup.returnedBannerDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* 5-Stage Order Fulfillment Stepper */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A93A3]">
                {t('track.orderLookup.stageProgressTitle')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {FORWARD_ORDER_STAGES.map((stage, idx) => {
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
                          <Truck className="w-4 h-4 text-[#FF6A00] shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 opacity-40 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs font-semibold leading-snug">
                        {t(`orders.statuses.${stage}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier & Tracking Information Box */}
            {(result.courier_name || result.tracking_number) && (
              <div className="rounded-lg bg-[#0E1013] border border-emerald-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      {t('orders.courierTrackingTitle')}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {result.courier_name && (
                        <span className="font-bold text-white">
                          {result.courier_name}
                        </span>
                      )}
                      {result.tracking_number && (
                        <span
                          dir="ltr"
                          className="rounded bg-[#1B1F26] border border-white/15 px-2.5 py-0.5 font-mono text-xs text-[#FFC21A]"
                        >
                          {result.tracking_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {result.tracking_url && (
                  <a
                    href={result.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      {t('orders.openCourierTrackingBtn')}
                    </Button>
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* Items & Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Items & Totals (7 cols) */}
            <Card className="lg:col-span-7 p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Package className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-bold font-heading text-white">
                  {t('orders.itemsHeading')}
                </h3>
              </div>

              <div className="divide-y divide-white/10">
                {(result.items ?? []).map((item, idx) => {
                  const localizedName =
                    getLocalized(item.name_i18n, lang) || item.name || item.sku;
                  return (
                    <div
                      key={`${item.sku}-${idx}`}
                      className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
                    >
                      <div className="min-w-0">
                        <span
                          dir="ltr"
                          className="text-xs font-mono font-bold text-[#FFC21A] me-2"
                        >
                          {item.sku}
                        </span>
                        <span className="font-semibold text-white">
                          {localizedName}
                        </span>
                        <div
                          dir="ltr"
                          className="text-xs text-[#8A93A3] mt-0.5 tabular-nums"
                        >
                          {formatPKRPrice(item.unit_price)} × {item.quantity}
                        </div>
                      </div>
                      <span
                        dir="ltr"
                        className="font-bold text-white tabular-nums shrink-0"
                      >
                        {formatPKRPrice(item.line_total)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg bg-[#0E1013] border border-white/10 p-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-[#8A93A3]">
                  <span>{t('cart.subtotal')}</span>
                  <span dir="ltr" className="text-white tabular-nums">
                    {formatPKRPrice(result.subtotal)}
                  </span>
                </div>
                {Number(result.discount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>
                      {t('cart.discount')}{' '}
                      {result.coupon_code ? `(${result.coupon_code})` : ''}
                    </span>
                    <span dir="ltr" className="tabular-nums">
                      -{formatPKRPrice(result.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#8A93A3]">
                  <span>
                    {t('cart.delivery')} ({result.city})
                  </span>
                  {Number(result.delivery_charge) === 0 ? (
                    <span className="font-bold text-emerald-400">
                      {t('cart.freeDelivery')}
                    </span>
                  ) : (
                    <span dir="ltr" className="text-white tabular-nums">
                      {formatPKRPrice(result.delivery_charge)}
                    </span>
                  )}
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between text-base font-bold text-white">
                  <span>{t('cart.total')}</span>
                  <span
                    dir="ltr"
                    className="text-lg text-[#FFC21A] tabular-nums"
                  >
                    {formatPKRPrice(result.total)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Status History Timeline (5 cols) */}
            <Card className="lg:col-span-5 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <History className="w-4 h-4 text-[#FF6A00]" />
                <h3 className="text-base font-bold font-heading text-white">
                  {t('orders.statusTimelineTitle')}
                </h3>
              </div>

              {(result.history ?? []).length === 0 ? (
                <p className="text-xs text-[#8A93A3]">
                  {t('orders.noHistoryYet')}
                </p>
              ) : (
                <ol className="relative border-s border-white/15 ms-2 space-y-4">
                  {(result.history ?? []).map((entry, idx) => (
                    <li key={idx} className="ms-4 space-y-1">
                      <span className="absolute -start-1.5 mt-1.5 w-3 h-3 rounded-full bg-[#FF6A00] border-2 border-[#0E1013]" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          variant={getOrderStatusBadgeVariant(entry.to_status)}
                        >
                          {t(`orders.statuses.${entry.to_status}`)}
                        </Badge>
                        <span
                          dir="ltr"
                          className="text-[11px] text-[#8A93A3] tabular-nums"
                        >
                          {formatKarachiDateTime(entry.created_at)}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-[#F5F6F8]">{entry.note}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
