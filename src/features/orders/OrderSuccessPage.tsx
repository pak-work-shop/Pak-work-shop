import React, { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  MessageCircle,
  Package,
  Printer,
  Search,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Seo } from '../../components/common/Seo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatPKR } from '../../lib/format';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import {
  getOrderPaymentStatusBadgeVariant,
  getOrderStatusBadgeVariant,
} from './orderUtils';
import type {
  OrderLookupItem,
  OrderLookupResponse,
  OrderPaymentStatus,
  OrderStatus,
} from '../../types/database';

export interface OrderSuccessState {
  order_id?: string;
  order_no: string;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: OrderPaymentStatus;
  status: OrderStatus;
  city: string;
  placed_at: string;
  customer_name?: string;
  customer_phone?: string;
  address_line?: string;
  items?: Array<{
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

interface DisplayOrderItem {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface DisplayOrderData {
  order_no: string;
  order_id?: string;
  customer_name?: string;
  customer_phone?: string;
  city: string;
  address_line?: string;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: OrderPaymentStatus;
  status: OrderStatus;
  placed_at: string;
  items: DisplayOrderItem[];
}

export function OrderSuccessPage() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const stateData = (location.state as { order?: OrderSuccessState })?.order;

  const [lookupPhone, setLookupPhone] = useState<string>('');
  const [lookingUp, setLookingUp] = useState<boolean>(false);
  const [fetchedOrder, setFetchedOrder] = useState<OrderLookupResponse | null>(null);

  const activeOrderNo = orderNo || stateData?.order_no || '';

  const handleCopyOrderNo = async () => {
    if (!activeOrderNo) return;
    try {
      await navigator.clipboard.writeText(activeOrderNo);
      toast.success(t('orderSuccess.copiedToast', 'Order number copied!'));
    } catch {
      toast.error(t('common.copyError', 'Failed to copy'));
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderNo || !lookupPhone.trim()) {
      toast.error(t('orderSuccess.enterPhonePrompt', 'Please enter your phone number'));
      return;
    }
    setLookingUp(true);
    try {
      const { data, error } = await supabase.rpc('lookup_order_status', {
        p_order_no: activeOrderNo.trim(),
        p_phone: lookupPhone.trim(),
      });

      if (error || !data) {
        toast.error(t('orderSuccess.lookupFailed', 'Order not found with this phone number.'));
        return;
      }
      setFetchedOrder(data as OrderLookupResponse);
    } catch {
      toast.error(t('orderSuccess.lookupFailed', 'Order not found with this phone number.'));
    } finally {
      setLookingUp(false);
    }
  };

  const displayData: DisplayOrderData | null = fetchedOrder
    ? {
        order_no: fetchedOrder.order_no,
        city: fetchedOrder.city,
        subtotal: fetchedOrder.subtotal,
        discount: fetchedOrder.discount,
        delivery_charge: fetchedOrder.delivery_charge,
        total: fetchedOrder.total,
        payment_method: fetchedOrder.payment_method,
        payment_status: fetchedOrder.payment_status,
        status: fetchedOrder.status,
        placed_at: fetchedOrder.placed_at,
        customer_phone: lookupPhone.trim(),
        items: (fetchedOrder.items || []).map((i: OrderLookupItem) => ({
          sku: i.sku,
          name: getLocalized(i.name_i18n, i18n.language) || i.name || i.sku,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total,
        })),
      }
    : stateData
    ? {
        order_no: stateData.order_no,
        order_id: stateData.order_id,
        customer_name: stateData.customer_name,
        customer_phone: stateData.customer_phone,
        city: stateData.city,
        address_line: stateData.address_line,
        subtotal: stateData.subtotal,
        discount: stateData.discount,
        delivery_charge: stateData.delivery_charge,
        total: stateData.total,
        payment_method: stateData.payment_method,
        payment_status: stateData.payment_status,
        status: stateData.status,
        placed_at: stateData.placed_at,
        items: stateData.items || [],
      }
    : null;

  const whatsappInquiryUrl = displayData
    ? buildWhatsAppUrl(
        settings.whatsapp || settings.phone || '03126776844',
        `Assalam-o-Alaikum Pak Auto Works & Parts! Regarding my order ${displayData.order_no} (${formatPKR(displayData.total)}). Please share an update.`
      )
    : '';

  return (
    <>
      <Seo
        title={`${activeOrderNo || 'Order Confirmed'} | Pak Auto Works & Parts`}
        noIndex
      />

      <div className="min-h-[70vh] bg-[#0E1013] text-[#F5F6F8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="text-center space-y-3 bg-[#1B1F26] border border-emerald-500/30 rounded-lg p-6 sm:p-8">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                {t('orderSuccess.title', 'Thank You! Your Order is Placed')}
              </h1>
              <p className="text-sm text-[#8A93A3] max-w-lg mx-auto">
                {t(
                  'orderSuccess.subtitle',
                  'We have received your order and our workshop team is processing it for dispatch.'
                )}
              </p>
            </div>

            {activeOrderNo && (
              <div className="inline-flex items-center gap-2 bg-[#0E1013] border border-white/15 rounded-md px-3.5 py-1.5 mt-2">
                <span className="text-xs text-[#8A93A3]">
                  {t('orderSuccess.orderNoLabel', 'Order Number')}:
                </span>
                <span className="font-mono font-bold text-sm text-[#FFC21A]" dir="ltr">
                  {activeOrderNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNo}
                  aria-label={t('common.copy', 'Copy')}
                  className="p-1 text-[#8A93A3] hover:text-white rounded transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* If page was reloaded and no router state */}
          {!displayData && (
            <Card className="p-6 space-y-4 border-amber-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">
                    {t('orderSuccess.reloadNoticeTitle', 'Looking up order details')}
                  </h3>
                  <p className="text-xs text-[#8A93A3]">
                    {t(
                      'orderSuccess.reloadNoticeDesc',
                      'Please enter the customer phone number used when placing this order to view item breakdown and live status.'
                    )}
                  </p>
                </div>
              </div>

              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 pt-2">
                <input
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder={t('orderSuccess.phonePlaceholder', '03XXXXXXXXX')}
                  dir="ltr"
                  className="flex-1 rounded-md bg-[#0E1013] border border-white/15 px-3 py-2 text-sm text-white placeholder-[#8A93A3] focus:border-[#FF6A00] focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={lookingUp}
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  {t('orderSuccess.lookupBtn', 'View Order Details')}
                </Button>
              </form>
            </Card>
          )}

          {/* Full Order Card */}
          {displayData && (
            <div className="space-y-6">
              {/* Payment & Delivery Notice */}
              <Card className="p-5 sm:p-6 bg-[#1B1F26] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#FF6A00]" />
                    <span className="font-bold text-sm text-white">
                      {t('orderSuccess.deliveryMethodTitle', 'Delivery & Payment')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getOrderStatusBadgeVariant(displayData.status)}>
                      {t(`order.statuses.${displayData.status}`, displayData.status)}
                    </Badge>
                    <Badge variant={getOrderPaymentStatusBadgeVariant(displayData.payment_status)}>
                      {t(`order.paymentStatuses.${displayData.payment_status}`, displayData.payment_status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#8A93A3] block mb-0.5">
                      {t('orderSuccess.customerLabel', 'Customer')}
                    </span>
                    <p className="font-semibold text-white">
                      {displayData.customer_name || 'Valued Customer'}
                    </p>
                    {displayData.customer_phone && (
                      <p className="text-[#8A93A3] font-mono" dir="ltr">
                        {displayData.customer_phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-[#8A93A3] block mb-0.5">
                      {t('orderSuccess.addressLabel', 'Destination')}
                    </span>
                    <p className="font-semibold text-white">
                      {displayData.city}
                    </p>
                    {displayData.address_line && (
                      <p className="text-[#8A93A3]">{displayData.address_line}</p>
                    )}
                  </div>
                </div>

                {displayData.payment_method === 'cod' && (
                  <div className="bg-[#0E1013] border border-amber-500/20 rounded-md p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>
                      {t(
                        'orderSuccess.codInstructions',
                        'Cash on Delivery: Please pay exact amount in cash to the rider / courier upon receiving your package.'
                      )}
                    </p>
                  </div>
                )}
              </Card>

              {/* Items Table */}
              <Card className="p-5 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF6A00]" />
                  <span>{t('orderSuccess.itemsTitle', 'Ordered Items')}</span>
                </h3>

                <div className="divide-y divide-white/10 text-xs">
                  {displayData.items.map((item: DisplayOrderItem, idx: number) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-[#8A93A3] font-mono text-[11px]" dir="ltr">
                          SKU: {item.sku} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-white tabular-nums">
                        {formatPKR(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#8A93A3]">
                    <span>{t('cart.subtotal', 'Subtotal')}</span>
                    <span className="tabular-nums">{formatPKR(displayData.subtotal)}</span>
                  </div>
                  {displayData.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>{t('cart.discount', 'Coupon Discount')}</span>
                      <span className="tabular-nums">-{formatPKR(displayData.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#8A93A3]">
                    <span>{t('cart.delivery', 'Delivery Charge')}</span>
                    <span className="tabular-nums">
                      {displayData.delivery_charge === 0
                        ? t('cart.freeBadge', 'FREE')
                        : formatPKR(displayData.delivery_charge)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-2">
                    <span>{t('cart.total', 'Total Payable')}</span>
                    <span className="text-[#FF6A00] tabular-nums font-mono">
                      {formatPKR(displayData.total)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {displayData.order_id && (
                  <Link to={`/order/${displayData.order_id}/print`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Printer className="w-4 h-4" />}
                    >
                      {t('orderSuccess.printReceiptBtn', 'Print Receipt')}
                    </Button>
                  </Link>
                )}

                <Link
                  to={`/track?tab=order&orderNo=${encodeURIComponent(
                    displayData.order_no
                  )}${displayData.customer_phone ? `&phone=${encodeURIComponent(displayData.customer_phone)}` : ''}`}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Truck className="w-4 h-4" />}
                  >
                    {t('orderSuccess.trackOrderBtn', 'Track Order')}
                  </Button>
                </Link>

                {whatsappInquiryUrl && (
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
                    >
                      {t('orderSuccess.whatsappUpdateBtn', 'WhatsApp Workshop')}
                    </Button>
                  </a>
                )}

                <Link to="/shop">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ShoppingBag className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('orderSuccess.continueShoppingBtn', 'Continue Shopping')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
