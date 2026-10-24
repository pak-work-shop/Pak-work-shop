import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Package, Printer, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatKarachiDateTime, formatPKR, pickLocalized } from '../../lib/format';
import type { LanguageCode } from '../../types/i18n';
import type { OrderItemRow, OrderRow } from '../../types/database';
import { useSiteSettings } from '../settings/useSiteSettings';
import { Seo } from '../../components/common/Seo';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { PrintLogo } from '../../components/common/PrintLogo';

interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[];
}

export function OrderPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as LanguageCode;
  const { settings } = useSiteSettings();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<'receipt' | 'packing_slip'>('receipt');

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setOrder(null);
      } else {
        setOrder(data as unknown as OrderWithItems);
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label={t('common.loading')} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">
            {t('orders.print.notFound')}
          </h1>
          <Link to="/account">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}>
              {t('orders.print.backBtn')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const businessAddress = pickLocalized(settings.address, currentLang);
  const items = order.order_items ?? [];
  const isCod = order.payment_method === 'cod';

  return (
    <div className="min-h-screen bg-[#0E1013] py-8 px-4 print:bg-white print:p-0">
      <Seo title={`${order.order_no} — ${t('orders.print.receiptHeading')}`} />

      {/* Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/account">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
          >
            {t('orders.print.backBtn')}
          </Button>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-white/10 bg-[#1B1F26] p-1">
            <button
              type="button"
              onClick={() => setPrintMode('receipt')}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                printMode === 'receipt'
                  ? 'bg-[#FF6A00] text-white'
                  : 'text-[#8A93A3] hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t('orders.print.customerReceiptMode')}</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('packing_slip')}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                printMode === 'packing_slip'
                  ? 'bg-[#FF6A00] text-white'
                  : 'text-[#8A93A3] hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{t('orders.print.packingSlipMode')}</span>
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            {t('orders.print.printBtn')}
          </Button>
        </div>
      </div>

      {/* Printable A4 Sheet */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 print:shadow-none print:rounded-none print:p-6">
        {order.is_demo && (
          <div className="mb-4 border border-amber-500 bg-amber-50 text-amber-900 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wider">
            {t('orders.print.demoWatermark')}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
          <div className="space-y-2">
            <PrintLogo />
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              {settings.business_name}
            </h1>
            {businessAddress && (
              <p className="text-xs text-slate-600 max-w-md">{businessAddress}</p>
            )}
            <p dir="ltr" className="text-xs font-mono text-slate-700">
              Tel: {settings.phone} • WhatsApp: {settings.whatsapp}
            </p>
          </div>

          <div className="text-end space-y-1">
            <span className="inline-block rounded bg-slate-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {printMode === 'packing_slip'
                ? t('orders.print.packingSlipHeading')
                : t('orders.print.receiptHeading')}
            </span>
            <p dir="ltr" className="text-xl font-black font-mono text-slate-900">
              {order.order_no}
            </p>
            <p dir="ltr" className="text-xs text-slate-600">
              {formatKarachiDateTime(order.placed_at)} (PKT)
            </p>
          </div>
        </div>

        {/* COD Collection Box for Courier Packing Slip */}
        {printMode === 'packing_slip' && (
          <div className="my-6 border-2 border-slate-900 rounded-md p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                {t('orders.print.paymentCollectionLabel')}
              </span>
              <span className="text-lg font-extrabold text-slate-900">
                {isCod
                  ? t('orders.paymentMethods.cod')
                  : t(`orders.paymentMethods.${order.payment_method}`)}
              </span>
            </div>
            <div className="text-end">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                {isCod
                  ? t('orders.print.codAmountToCollect')
                  : t('orders.print.orderTotalLabel')}
              </span>
              <span dir="ltr" className="text-2xl font-black font-mono text-slate-900">
                {isCod && order.payment_status !== 'paid'
                  ? formatPKR(order.total)
                  : formatPKR(0)}
              </span>
            </div>
          </div>
        )}

        {/* Ship To & Order Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('orders.print.shipTo')}
            </h2>
            <p className="text-base font-bold text-slate-900">{order.customer_name}</p>
            <p dir="ltr" className="font-mono font-semibold text-slate-800">
              {order.customer_phone}
            </p>
            {order.customer_email && (
              <p dir="ltr" className="text-slate-600">
                {order.customer_email}
              </p>
            )}
            <p className="text-slate-800 font-medium pt-1">
              {order.address_line}
            </p>
            <p className="font-bold text-slate-900 uppercase tracking-wide">
              {order.city}, Pakistan
            </p>
            {order.address_notes && (
              <p className="text-xs text-slate-600 italic">
                {t('checkout.fields.addressNotes')}: {order.address_notes}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:text-end">
            <div>
              <span className="text-xs text-slate-500 block">
                {t('orders.print.orderStatus')}
              </span>
              <span className="font-bold text-slate-900">
                {t(`orders.statuses.${order.status}`)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">
                {t('orders.print.paymentMethod')}
              </span>
              <span className="font-semibold text-slate-800">
                {t(`orders.paymentMethods.${order.payment_method}`)} (
                {t(`orders.paymentStatuses.${order.payment_status}`)})
              </span>
            </div>
            {order.courier_name && (
              <div>
                <span className="text-xs text-slate-500 block">
                  {t('orders.print.courierInfo')}
                </span>
                <span dir="ltr" className="font-mono font-semibold text-slate-900">
                  {order.courier_name}
                  {order.tracking_number ? ` — ${order.tracking_number}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-600">
                <th className="py-2 text-start font-bold">SKU</th>
                <th className="py-2 text-start font-bold">
                  {t('orders.print.colItem')}
                </th>
                <th className="py-2 text-end font-bold">
                  {t('orders.print.colQty')}
                </th>
                {printMode === 'receipt' && (
                  <>
                    <th className="py-2 text-end font-bold">
                      {t('orders.print.colUnitPrice')}
                    </th>
                    <th className="py-2 text-end font-bold">
                      {t('orders.print.colTotal')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const localName =
                  pickLocalized(item.name_i18n, currentLang) || item.name;
                return (
                  <tr key={item.id}>
                    <td dir="ltr" className="py-3 pe-3 font-mono text-xs text-slate-600">
                      {item.sku}
                    </td>
                    <td className="py-3 pe-3 font-medium text-slate-900">
                      {localName}
                    </td>
                    <td dir="ltr" className="py-3 text-end font-bold tabular-nums">
                      {item.quantity}
                    </td>
                    {printMode === 'receipt' && (
                      <>
                        <td dir="ltr" className="py-3 text-end tabular-nums text-slate-700">
                          {formatPKR(item.unit_price)}
                        </td>
                        <td
                          dir="ltr"
                          className="py-3 text-end font-semibold tabular-nums text-slate-900"
                        >
                          {formatPKR(item.line_total)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row justify-between gap-6">
          <div className="text-xs text-slate-600 space-y-1 max-w-md">
            {order.customer_notes && (
              <p>
                <strong>{t('checkout.fields.customerNotes')}:</strong>{' '}
                {order.customer_notes}
              </p>
            )}
            <p className="pt-2 font-medium text-slate-700">
              {t('orders.print.thankYouNote')}
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{t('cart.summary.subtotal')}</span>
              <span dir="ltr" className="font-mono tabular-nums">
                {formatPKR(order.subtotal)}
              </span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>
                  {t('cart.summary.discount')}
                  {order.coupon_code ? ` (${order.coupon_code})` : ''}
                </span>
                <span dir="ltr" className="font-mono tabular-nums">
                  -{formatPKR(order.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>
                {t('cart.summary.delivery')} ({order.city})
              </span>
              <span dir="ltr" className="font-mono tabular-nums">
                {Number(order.delivery_charge) === 0
                  ? t('cart.delivery.freeBadge')
                  : formatPKR(order.delivery_charge)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-2 text-base font-extrabold text-slate-900">
              <span>{t('cart.summary.total')}</span>
              <span dir="ltr" className="font-mono tabular-nums">
                {formatPKR(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
