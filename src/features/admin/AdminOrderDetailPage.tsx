import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  FlaskConical,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  Save,
  Truck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  formatKarachiDateTime,
  formatPKR,
  pickLocalized,
} from '../../lib/format';
import type { LanguageCode } from '../../types/i18n';
import {
  buildCourierTrackingUrl,
  CourierPreset,
  getAllowedAdminOrderTransitions,
  getOrderPaymentStatusBadgeVariant,
  getOrderStatusBadgeVariant,
  PAKISTAN_COURIER_PRESETS,
} from '../orders/orderUtils';
import type {
  OrderItemRow,
  OrderPaymentStatus,
  OrderRow,
  OrderStatus,
  OrderStatusHistoryRow,
} from '../../types/database';
import { Seo } from '../../components/common/Seo';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Textarea } from '../../components/ui/Textarea';

interface OrderDetailWithRelations extends OrderRow {
  order_items: OrderItemRow[];
  order_status_history: OrderStatusHistoryRow[];
}

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as LanguageCode;

  const [order, setOrder] = useState<OrderDetailWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // Stage transition modal
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Shipping & Courier form
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [savingShipping, setSavingShipping] = useState(false);

  // Payment status & Admin notes form
  const [paymentStatus, setPaymentStatus] =
    useState<OrderPaymentStatus>('cod_pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingPaymentNotes, setSavingPaymentNotes] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), order_status_history(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setOrder(null);
      } else {
        const typed = data as unknown as OrderDetailWithRelations;
        setOrder(typed);
        setCourierName(typed.courier_name ?? '');
        setTrackingNumber(typed.tracking_number ?? '');
        setTrackingUrl(typed.tracking_url ?? '');
        setPaymentStatus(typed.payment_status);
        setAdminNotes(typed.admin_notes ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const handleConfirmStatusTransition = async () => {
    if (!order || !targetStatus) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase.rpc('admin_update_order_status', {
        p_order_id: order.id,
        p_status: targetStatus,
        p_note: transitionNote.trim() || null,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid_transition')) {
          toast.error(t('admin.orders.detail.invalidTransitionError'));
        } else {
          toast.error(t('admin.orders.detail.statusUpdateError'));
        }
        return;
      }

      toast.success(t('admin.orders.detail.statusUpdatedSuccess'));
      setTargetStatus(null);
      setTransitionNote('');
      await fetchOrder();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSavingShipping(true);
    try {
      const { error } = await supabase.rpc('admin_set_shipping', {
        p_order_id: order.id,
        p_courier: courierName.trim() || '',
        p_tracking_no: trackingNumber.trim() || '',
        p_tracking_url: trackingUrl.trim() || null,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid_tracking_url')) {
          toast.error(t('validation.urlInvalid'));
        } else {
          toast.error(t('admin.orders.detail.shippingSaveError'));
        }
        return;
      }

      toast.success(t('admin.orders.detail.shippingSavedSuccess'));
      await fetchOrder();
    } finally {
      setSavingShipping(false);
    }
  };

  const handleSavePaymentAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSavingPaymentNotes(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          admin_notes: adminNotes.trim() || null,
        })
        .eq('id', order.id);

      if (error) {
        toast.error(t('admin.orders.detail.notesSaveError'));
        return;
      }

      toast.success(t('admin.orders.detail.notesSavedSuccess'));
      await fetchOrder();
    } finally {
      setSavingPaymentNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner size="lg" label={t('common.loading')} />
      </div>
    );
  }

  if (!order) {
    return (
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">
          {t('orders.print.notFound')}
        </h2>
        <Link to="/admin/orders">
          <Button
            variant="primary"
            leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
          >
            {t('admin.orders.detail.backToOrders')}
          </Button>
        </Link>
      </Card>
    );
  }

  const allowedTransitions = getAllowedAdminOrderTransitions(order.status);
  const items = order.order_items ?? [];
  const history = (order.order_status_history ?? []).slice().sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const whatsappText = t('admin.orders.detail.whatsappPrefill', {
    name: order.customer_name,
    orderNo: order.order_no,
    status: t(`orders.statuses.${order.status}`),
    total: formatPKR(order.total),
    tracking: order.tracking_number
      ? `${order.courier_name || 'Courier'}: ${order.tracking_number}`
      : '—',
  });

  return (
    <div className="space-y-6 text-start">
      <Seo title={`${order.order_no} — ${t('admin.orders.title')}`} />

      {/* Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A93A3] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl-flip" />
            <span>{t('admin.orders.detail.backToOrders')}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1
              dir="ltr"
              className="text-2xl sm:text-3xl font-extrabold font-mono text-[#FFC21A]"
            >
              {order.order_no}
            </h1>
            <Badge variant={getOrderStatusBadgeVariant(order.status)}>
              {t(`orders.statuses.${order.status}`)}
            </Badge>
            <Badge
              variant={getOrderPaymentStatusBadgeVariant(order.payment_status)}
            >
              {t(`orders.paymentStatuses.${order.payment_status}`)}
            </Badge>
            {order.is_demo && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-semibold text-[#FFC21A]">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{t('demo.badge')}</span>
              </span>
            )}
          </div>
          <p dir="ltr" className="text-xs text-[#8A93A3]">
            {t('track.orderLookup.placedAtLabel')}:{' '}
            {formatKarachiDateTime(order.placed_at)} (PKT)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={buildWhatsAppUrl(order.customer_phone, whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
            >
              {t('admin.orders.detail.whatsappCustomerBtn')}
            </Button>
          </a>
          <a href={buildTelUrl(order.customer_phone)}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Phone className="w-4 h-4" />}
            >
              {t('admin.orders.detail.callCustomerBtn')}
            </Button>
          </a>
          <Link to={`/order/${order.id}/print`}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              {t('admin.orders.detail.printReceiptAndSlipBtn')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Order Items, Customer & Address, Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer & Shipping Address Card */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <MapPin className="w-4 h-4 text-[#FF6A00]" />
              <span>{t('admin.orders.detail.customerAndShippingTitle')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-xs text-[#8A93A3] block">
                  {t('checkout.fields.customerName')}
                </span>
                <p className="font-bold text-white text-base">
                  {order.customer_name}
                </p>
                <p dir="ltr" className="font-mono text-[#FFC21A]">
                  {order.customer_phone}
                </p>
                {order.customer_email && (
                  <p dir="ltr" className="text-[#8A93A3]">
                    {order.customer_email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#8A93A3] block">
                  {t('account.orders.deliveryAddress')}
                </span>
                <p className="font-bold text-[#FFC21A]">{order.city}</p>
                <p className="text-white">{order.address_line}</p>
                {order.address_notes && (
                  <p className="text-xs text-[#8A93A3] italic">
                    {order.address_notes}
                  </p>
                )}
              </div>
            </div>

            {order.customer_notes && (
              <div className="rounded bg-[#0E1013] border border-white/10 p-3 text-xs">
                <span className="text-[#8A93A3] font-semibold block mb-0.5">
                  {t('checkout.fields.customerNotes')}:
                </span>
                <p className="text-white">{order.customer_notes}</p>
              </div>
            )}
          </Card>

          {/* Line Items & Pricing Breakdown */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Package className="w-4 h-4 text-[#FF6A00]" />
              <span>
                {t('track.orderLookup.itemsTitle')} ({items.length})
              </span>
            </h2>

            <div className="overflow-x-auto rounded border border-white/10 bg-[#0E1013]">
              <table className="w-full text-xs sm:text-sm text-start">
                <thead>
                  <tr className="border-b border-white/10 text-[#8A93A3]">
                    <th className="py-2.5 px-3 text-start">SKU</th>
                    <th className="py-2.5 px-3 text-start">
                      {t('orders.print.colItem')}
                    </th>
                    <th className="py-2.5 px-3 text-end">
                      {t('orders.print.colQty')}
                    </th>
                    <th className="py-2.5 px-3 text-end">
                      {t('orders.print.colUnitPrice')}
                    </th>
                    <th className="py-2.5 px-3 text-end">
                      {t('orders.print.colTotal')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {items.map((item) => {
                    const localName =
                      pickLocalized(item.name_i18n, currentLang) || item.name;
                    return (
                      <tr key={item.id}>
                        <td
                          dir="ltr"
                          className="py-2.5 px-3 font-mono text-xs text-[#8A93A3]"
                        >
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3 text-white font-medium">
                          {localName}
                        </td>
                        <td
                          dir="ltr"
                          className="py-2.5 px-3 text-end font-bold tabular-nums"
                        >
                          {item.quantity}
                        </td>
                        <td
                          dir="ltr"
                          className="py-2.5 px-3 text-end tabular-nums text-[#8A93A3]"
                        >
                          {formatPKR(item.unit_price)}
                        </td>
                        <td
                          dir="ltr"
                          className="py-2.5 px-3 text-end font-semibold tabular-nums text-white"
                        >
                          {formatPKR(item.line_total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-2 text-xs sm:text-sm">
              <div className="flex justify-between text-[#8A93A3]">
                <span>{t('cart.summary.subtotal')}</span>
                <span dir="ltr" className="font-mono text-white">
                  {formatPKR(order.subtotal)}
                </span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>
                    {t('cart.summary.discount')}
                    {order.coupon_code ? ` (${order.coupon_code})` : ''}
                  </span>
                  <span dir="ltr" className="font-mono">
                    -{formatPKR(order.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#8A93A3]">
                <span>
                  {t('cart.summary.delivery')} ({order.city})
                </span>
                <span dir="ltr" className="font-mono text-white">
                  {Number(order.delivery_charge) === 0
                    ? t('cart.delivery.freeBadge')
                    : formatPKR(order.delivery_charge)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2.5 text-base font-extrabold text-white">
                <span>{t('cart.summary.total')}</span>
                <span dir="ltr" className="font-mono text-[#FFC21A]">
                  {formatPKR(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Status History Timeline */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Clock className="w-4 h-4 text-[#FF6A00]" />
              <span>{t('track.orderLookup.timelineTitle')}</span>
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-[#8A93A3]">—</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-md bg-[#0E1013] border border-white/10 p-3 text-xs space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {h.from_status && (
                          <>
                            <Badge
                              variant={getOrderStatusBadgeVariant(h.from_status)}
                            >
                              {t(`orders.statuses.${h.from_status}`)}
                            </Badge>
                            <span className="text-[#8A93A3]">→</span>
                          </>
                        )}
                        <Badge variant={getOrderStatusBadgeVariant(h.to_status)}>
                          {t(`orders.statuses.${h.to_status}`)}
                        </Badge>
                      </div>
                      <span dir="ltr" className="text-[#8A93A3]">
                        {formatKarachiDateTime(h.created_at)} (PKT)
                      </span>
                    </div>
                    {h.note && <p className="text-white/90 pt-1">{h.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (5 cols): Stage Transitions, Courier & Tracking, Payment & Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Order Stage Transitions */}
          <Card className="p-5 sm:p-6 space-y-4 border-t-4 border-t-[#FF6A00]">
            <div>
              <h2 className="text-base font-bold text-white">
                {t('admin.orders.detail.stageCardTitle')}
              </h2>
              <p className="text-xs text-[#8A93A3] mt-0.5">
                {t('admin.orders.detail.stageCardSubtitle')}
              </p>
            </div>

            {allowedTransitions.length === 0 ? (
              <p className="text-xs text-[#8A93A3] rounded bg-[#0E1013] p-3 border border-white/10">
                {t('admin.orders.detail.terminalStageNote', {
                  status: t(`orders.statuses.${order.status}`),
                })}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map((nextSt) => {
                  const isDestructive =
                    nextSt === 'cancelled' || nextSt === 'returned';
                  return (
                    <Button
                      key={nextSt}
                      type="button"
                      variant={isDestructive ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => {
                        setTargetStatus(nextSt);
                        setTransitionNote('');
                      }}
                    >
                      {t('admin.orders.detail.moveToStageBtn', {
                        stage: t(`orders.statuses.${nextSt}`),
                      })}
                    </Button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 2. Courier & Tracking Details (admin_set_shipping RPC) */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Truck className="w-4 h-4 text-[#FF6A00]" />
              <span>{t('admin.orders.detail.shippingCardTitle')}</span>
            </h2>

            <form onSubmit={handleSaveShipping} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#8A93A3] mb-1.5">
                  {t('admin.orders.detail.quickSelectCourier')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PAKISTAN_COURIER_PRESETS.map((preset: CourierPreset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setCourierName(preset.name);
                        const autoUrl = buildCourierTrackingUrl(
                          preset.name,
                          trackingNumber
                        );
                        if (autoUrl) setTrackingUrl(autoUrl);
                      }}
                      className={`rounded px-2 py-1 text-[11px] font-semibold border transition-colors cursor-pointer ${
                        courierName === preset.name
                          ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-white'
                          : 'bg-[#0E1013] border-white/10 text-[#8A93A3] hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label={t('admin.orders.detail.courierNameLabel')}
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. TCS / Leopards Courier / M&P"
              />

              <Input
                label={t('admin.orders.detail.trackingNumberLabel')}
                dir="ltr"
                value={trackingNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setTrackingNumber(val);
                  const autoUrl = buildCourierTrackingUrl(courierName, val);
                  if (autoUrl) setTrackingUrl(autoUrl);
                }}
                placeholder="e.g. 7788990011"
              />

              <Input
                label={t('admin.orders.detail.trackingUrlLabel')}
                dir="ltr"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
              />

              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#FF6A00] hover:underline"
                >
                  <span>{t('track.orderLookup.openCourierTracking')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingShipping}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {t('admin.orders.detail.saveShippingBtn')}
                </Button>
              </div>
            </form>
          </Card>

          {/* 3. Payment Status & Internal Admin Notes */}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-white/10 pb-3">
              {t('admin.orders.detail.paymentAndNotesTitle')}
            </h2>

            <form onSubmit={handleSavePaymentAndNotes} className="space-y-3">
              <Select
                label={t('admin.orders.detail.paymentStatusLabel')}
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as OrderPaymentStatus)
                }
                options={(
                  [
                    'cod_pending',
                    'cod_collected',
                    'pending',
                    'paid',
                    'failed',
                    'refunded',
                  ] as OrderPaymentStatus[]
                ).map((ps) => ({
                  value: ps,
                  label: t(`orders.paymentStatuses.${ps}`),
                }))}
              />

              <Textarea
                label={t('admin.orders.detail.adminNotesLabel')}
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('admin.orders.detail.adminNotesPlaceholder')}
              />

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={savingPaymentNotes}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Modal: Confirm Order Stage Transition */}
      <Modal
        isOpen={Boolean(targetStatus)}
        onClose={() => setTargetStatus(null)}
        title={t('admin.orders.detail.confirmStageModalTitle')}
      >
        <div className="space-y-4 text-start">
          <p className="text-sm text-[#F5F6F8]">
            {t('admin.orders.detail.confirmStageModalDesc', {
              orderNo: order.order_no,
              from: t(`orders.statuses.${order.status}`),
              to: targetStatus ? t(`orders.statuses.${targetStatus}`) : '',
            })}
          </p>

          {(targetStatus === 'cancelled' || targetStatus === 'returned') && (
            <div className="rounded bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-[#FFC21A]">
              {t('admin.orders.detail.stockRestoreNotice')}
            </div>
          )}

          {targetStatus === 'delivered' && order.payment_method === 'cod' && (
            <div className="rounded bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              {t('admin.orders.detail.codCollectedNotice')}
            </div>
          )}

          <Textarea
            label={t('admin.orders.detail.transitionNoteLabel')}
            rows={2}
            value={transitionNote}
            onChange={(e) => setTransitionNote(e.target.value)}
            placeholder={t('admin.orders.detail.transitionNotePlaceholder')}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTargetStatus(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant={
                targetStatus === 'cancelled' || targetStatus === 'returned'
                  ? 'danger'
                  : 'primary'
              }
              isLoading={updatingStatus}
              onClick={handleConfirmStatusTransition}
            >
              {t('admin.orders.detail.confirmStageBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
