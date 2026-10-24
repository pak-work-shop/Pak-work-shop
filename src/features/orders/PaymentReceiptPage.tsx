import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Printer,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatKarachiDateTime, formatPKR, pickLocalized } from '../../lib/format';
import type { LanguageCode } from '../../types/i18n';
import type { OrderRow, PaymentRow } from '../../types/database';
import { useSiteSettings } from '../settings/useSiteSettings';
import { Seo } from '../../components/common/Seo';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { PrintLogo } from '../../components/common/PrintLogo';

export function PaymentReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as LanguageCode;
  const { settings } = useSiteSettings();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReceipt = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (orderErr || !orderData) {
        setOrder(null);
        setPayment(null);
        return;
      }

      setOrder(orderData as unknown as OrderRow);

      // Fetch verified/succeeded payment for this order
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setPayment((payData as unknown as PaymentRow) || null);
    } catch {
      setOrder(null);
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchReceipt();
  }, [fetchReceipt]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0E1013]">
        <Spinner size="lg" label={t('common.loading', 'Loading receipt...')} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-white">
            {t('orders.print.notFound', 'Receipt not found or you do not have permission to view it.')}
          </h1>
          <Link to="/account">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}>
              {t('orders.print.backBtn', 'Back to Account')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const businessAddress = pickLocalized(settings.address, currentLang);
  const isDemo = Boolean(settings.demo_mode) || Boolean(order.is_demo);

  return (
    <div className="min-h-screen bg-[#0E1013] py-8 px-4 print:bg-white print:p-0">
      <Seo title={`Payment Receipt ${order.order_no} — Pak Auto Works & Parts`} />

      {/* Action Bar (Hidden in Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/account">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
          >
            {t('orders.print.backBtn', 'Back')}
          </Button>
        </Link>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => window.print()}
          leftIcon={<Printer className="w-4 h-4" />}
        >
          {t('orders.print.printAction', 'Print Payment Receipt')}
        </Button>
      </div>

      {/* A4 Printable Receipt Document */}
      <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-12 print:p-6 print:shadow-none print:rounded-none relative overflow-hidden border border-slate-200 print:border-none">
        {/* Demo Watermark */}
        {isDemo && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] select-none rotate-[-30deg]">
            <span className="text-8xl font-black tracking-widest text-slate-900">DEMO RECEIPT</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 border-b-2 border-slate-900 pb-6">
          <div className="space-y-2">
            <PrintLogo />
            <h1 className="text-xl font-black tracking-wider uppercase text-slate-950 font-heading">
              {settings.business_name || 'Pak Auto Works & Parts'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">{businessAddress || 'Main Workshop, KLP Road, Sadiqabad, Punjab'}</p>
            <p className="text-xs text-slate-600" dir="ltr">{settings.phone} • {settings.email}</p>
          </div>

          <div className="text-end">
            <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded text-xs uppercase tracking-wider mb-2">
              Official Payment Receipt
            </span>
            <p className="text-xs text-slate-500">Order Number</p>
            <p className="font-mono font-bold text-base text-slate-900">{order.order_no}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {formatKarachiDateTime(payment?.verified_at || order.updated_at)}
            </p>
          </div>
        </div>

        {/* Customer & Payment Meta */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider font-semibold block mb-1">Billed To</span>
            <p className="font-bold text-slate-900 text-sm">{order.customer_name}</p>
            <p className="text-slate-600 font-mono" dir="ltr">{order.customer_phone}</p>
            <p className="text-slate-600 mt-0.5">{order.city}, Pakistan</p>
          </div>

          <div className="text-end">
            <span className="text-slate-500 uppercase tracking-wider font-semibold block mb-1">Payment Information</span>
            <p className="font-semibold text-slate-900 uppercase">
              {order.payment_method === 'cod' ? 'Cash on Delivery' : payment?.method || 'Online Payment'}
            </p>
            {payment?.transaction_id && (
              <p className="text-slate-700 font-mono text-[11px] mt-0.5" dir="ltr">
                TxID: {payment.transaction_id}
              </p>
            )}
            <p className="text-emerald-700 font-bold text-xs mt-1 flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status: {order.payment_status.toUpperCase()}</span>
            </p>
          </div>
        </div>

        {/* Receipt Amount Summary */}
        <div className="py-6 space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Order Subtotal</span>
            <span className="font-mono">{formatPKR(order.subtotal)}</span>
          </div>

          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
              <span className="font-mono">- {formatPKR(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Delivery Shipping Charge ({order.city})</span>
            <span className="font-mono">
              {Number(order.delivery_charge) === 0 ? 'FREE' : formatPKR(order.delivery_charge)}
            </span>
          </div>

          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-base font-black text-slate-950">
            <span>Total Paid (PKR)</span>
            <span className="font-mono text-xl">{formatPKR(order.total)}</span>
          </div>
        </div>

        {/* Footer & Verification Seal */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Electronically verified digital payment receipt</span>
          </div>
          <p className="text-[11px]">Pak Auto Works & Parts • NTN / Sadiqabad, Punjab, Pakistan</p>
        </div>
      </div>
    </div>
  );
}
