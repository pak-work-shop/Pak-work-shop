import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import {
  formatKarachiDateTime,
  formatPKR,
  isMissingDatabaseObjectsError,
} from './jobUtils';
import type {
  InvoiceItemSnapshot,
  InvoiceRow,
  JobCardRow,
  JobPaymentRow,
} from '../../types/database';
import { Button, Spinner } from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PrintLogo } from '../../components/common/PrintLogo';

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [job, setJob] = useState<JobCardRow | null>(null);
  const [payments, setPayments] = useState<JobPaymentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [schemaMissing, setSchemaMissing] = useState<boolean>(false);

  useEffect(() => {
    if (!id || !env.isConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const invRes = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (invRes.error) {
          if (isMissingDatabaseObjectsError(invRes.error)) {
            if (!cancelled) setSchemaMissing(true);
          }
          if (!cancelled) setInvoice(null);
          return;
        }

        if (!invRes.data) {
          if (!cancelled) setInvoice(null);
          return;
        }

        const invData = invRes.data as unknown as InvoiceRow;

        const [jobRes, payRes] = await Promise.all([
          supabase
            .from('job_cards')
            .select(
              'id, job_no, booking_id, user_id, customer_name, customer_phone, customer_email, make_id, model_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in, status, complaint, estimated_completion, public_note, show_cost_to_customer, received_at, delivered_at, is_demo, created_at, updated_at'
            )
            .eq('id', invData.job_id)
            .maybeSingle(),
          supabase
            .from('job_payments')
            .select('*')
            .eq('invoice_id', invData.id)
            .order('paid_at', { ascending: true }),
        ]);

        if (!cancelled) {
          setInvoice(invData);
          setJob((jobRes.data as unknown as JobCardRow) ?? null);
          setPayments((payRes.data as unknown as JobPaymentRow[]) ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1013] flex items-center justify-center">
        <Spinner size="lg" label={t('common.loading')} />
      </div>
    );
  }

  if (schemaMissing) {
    return (
      <div className="min-h-screen bg-[#0E1013] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-[#FFC21A]" />
        <h1 className="text-xl font-bold font-heading">
          {t('common.databaseSetupNeededTitle')}
        </h1>
        <p className="text-sm text-[#8A93A3] max-w-md">
          {t('common.databaseSetupNeededDesc')}
        </p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {t('invoices.print.backBtn')}
        </Button>
      </div>
    );
  }

  if (!invoice || !job) {
    return (
      <div className="min-h-screen bg-[#0E1013] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-base text-[#F5F6F8]">
          {t('invoices.print.notFound')}
        </p>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
          onClick={() => navigate(-1)}
        >
          {t('invoices.print.backBtn')}
        </Button>
      </div>
    );
  }

  const items: InvoiceItemSnapshot[] = Array.isArray(invoice.items_snapshot)
    ? invoice.items_snapshot
    : [];
  const balanceDue = Math.max(
    0,
    Number(invoice.total ?? 0) - Number(invoice.amount_paid ?? 0)
  );
  const addressText = getLocalized(settings, 'address', i18n.language);
  const businessName = settings.business_name || 'Pak Auto Works & Parts';
  const businessPhone = settings.phone || '03126776844';

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 px-4 print:p-0 text-slate-900">
      <Seo title={`${invoice.invoice_no} — ${t('invoices.print.invoiceHeading')}`} />

      {/* Top Non-Printable Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden bg-[#0E1013] text-white p-4 rounded-lg shadow-md">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
          onClick={() => navigate(-1)}
        >
          {t('invoices.print.backBtn')}
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          {t('invoices.print.printBtn')}
        </Button>
      </div>

      {/* Printable A4 Sheet */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 print:border-0 rounded-lg print:rounded-none shadow-lg print:shadow-none p-6 sm:p-10 space-y-8 text-start">
        {/* Demo Watermark Banner */}
        {(invoice.is_demo || job.is_demo) && (
          <div className="rounded border border-amber-400 bg-amber-50 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-amber-900">
            {t('invoices.print.demoWatermark')}
          </div>
        )}

        {/* Header: Workshop Details & Invoice Meta */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
          <div className="space-y-2">
            <PrintLogo />
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
              {businessName}
            </h1>
            {addressText && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm">
                {addressText}
              </p>
            )}
            <p dir="ltr" className="text-xs sm:text-sm font-mono text-slate-700">
              Tel: {businessPhone}
              {settings.email ? ` • ${settings.email}` : ''}
            </p>
          </div>

          <div className="sm:text-end space-y-1.5">
            <div className="inline-block rounded bg-slate-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {t('invoices.print.invoiceHeading')}
            </div>
            <div className="text-xs sm:text-sm space-y-0.5 pt-1">
              <div>
                <span className="text-slate-500">
                  {t('invoices.print.invoiceNo')}:{' '}
                </span>
                <span dir="ltr" className="font-mono font-bold text-slate-900">
                  {invoice.invoice_no}
                </span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('invoices.print.jobNo')}:{' '}
                </span>
                <span dir="ltr" className="font-mono font-semibold text-slate-800">
                  {job.job_no}
                </span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('invoices.print.issuedDate')}:{' '}
                </span>
                <span dir="ltr" className="text-slate-800">
                  {formatKarachiDateTime(invoice.issued_at || invoice.created_at)}
                </span>
              </div>
              {invoice.due_date && (
                <div>
                  <span className="text-slate-500">
                    {t('invoices.print.dueDate')}:{' '}
                  </span>
                  <span dir="ltr" className="text-slate-800">
                    {invoice.due_date}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500">
                  {t('invoices.print.status')}:{' '}
                </span>
                <span className="font-bold uppercase text-slate-900">
                  {t(`invoices.statuses.${invoice.status}`)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-md border border-slate-200 p-4 space-y-1.5 bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('invoices.print.billTo')}
            </h2>
            <p className="text-base font-bold text-slate-900">
              {job.customer_name}
            </p>
            <p dir="ltr" className="text-xs sm:text-sm font-mono text-slate-700">
              {job.customer_phone}
            </p>
            {job.customer_email && (
              <p dir="ltr" className="text-xs text-slate-600">
                {job.customer_email}
              </p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 p-4 space-y-1.5 bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('invoices.print.vehicleDetails')}
            </h2>
            <p className="text-base font-bold text-slate-900">
              {[job.make_text, job.model_text].filter(Boolean).join(' ')}{' '}
              {job.vehicle_year ? `(${job.vehicle_year})` : ''}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
              {job.plate_number && (
                <span>
                  {t('invoices.print.plate')}:{' '}
                  <strong dir="ltr" className="font-mono">
                    {job.plate_number}
                  </strong>
                </span>
              )}
              {job.mileage_in != null && (
                <span>
                  {t('invoices.print.mileage')}:{' '}
                  <strong dir="ltr">
                    {job.mileage_in.toLocaleString()} km
                  </strong>
                </span>
              )}
              {job.fuel_type && (
                <span>
                  {t('invoices.print.fuel')}:{' '}
                  <strong>{t(`booking.fuelTypes.${job.fuel_type}`)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-700 bg-slate-100">
                <th className="py-2.5 px-3 text-start font-bold">
                  {t('invoices.print.colType')}
                </th>
                <th className="py-2.5 px-3 text-start font-bold">
                  {t('invoices.print.colDescription')}
                </th>
                <th className="py-2.5 px-3 text-end font-bold">
                  {t('invoices.print.colQty')}
                </th>
                <th className="py-2.5 px-3 text-end font-bold">
                  {t('invoices.print.colUnitPrice')}
                </th>
                <th className="py-2.5 px-3 text-end font-bold">
                  {t('invoices.print.colLineTotal')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                    {t(`jobs.itemTypes.${item.item_type}`)}
                  </td>
                  <td className="py-3 px-3 text-slate-900 font-medium">
                    {item.description}
                  </td>
                  <td
                    dir="ltr"
                    className="py-3 px-3 text-end tabular-nums text-slate-800"
                  >
                    {item.quantity}
                  </td>
                  <td
                    dir="ltr"
                    className="py-3 px-3 text-end tabular-nums text-slate-700"
                  >
                    {formatPKR(item.unit_price)}
                  </td>
                  <td
                    dir="ltr"
                    className="py-3 px-3 text-end tabular-nums font-bold text-slate-900"
                  >
                    {formatPKR(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start pt-2 border-t border-slate-300">
          <div className="sm:col-span-7 space-y-4">
            {invoice.notes && (
              <div className="rounded border border-slate-200 p-3.5 bg-slate-50 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('invoices.print.notesTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}

            {payments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t('invoices.print.paymentHistoryTitle')}
                </h3>
                <table className="w-full text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="py-1.5 px-2.5 text-start">
                        {t('invoices.print.paymentDate')}
                      </th>
                      <th className="py-1.5 px-2.5 text-start">
                        {t('invoices.print.paymentMethod')}
                      </th>
                      <th className="py-1.5 px-2.5 text-start">
                        {t('invoices.print.paymentRef')}
                      </th>
                      <th className="py-1.5 px-2.5 text-end">
                        {t('invoices.print.paymentAmount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td dir="ltr" className="py-1.5 px-2.5 text-slate-700">
                          {formatKarachiDateTime(p.paid_at)}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-800">
                          {t(`invoices.paymentMethods.${p.method}`)}
                        </td>
                        <td dir="ltr" className="py-1.5 px-2.5 text-slate-600">
                          {p.reference || '—'}
                        </td>
                        <td
                          dir="ltr"
                          className="py-1.5 px-2.5 text-end font-semibold text-slate-900 tabular-nums"
                        >
                          {formatPKR(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="sm:col-span-5 rounded-md border border-slate-300 p-4 space-y-2.5 bg-slate-50">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">
                {t('invoices.print.subtotal')}
              </span>
              <span dir="ltr" className="font-semibold tabular-nums">
                {formatPKR(invoice.subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600">
                {t('invoices.print.discount')}
              </span>
              <span dir="ltr" className="font-semibold tabular-nums text-emerald-700">
                - {formatPKR(invoice.discount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm sm:text-base font-bold border-t border-slate-300 pt-2 text-slate-900">
              <span>{t('invoices.print.grandTotal')}</span>
              <span dir="ltr" className="tabular-nums">
                {formatPKR(invoice.total)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700">
              <span>{t('invoices.print.amountPaid')}</span>
              <span dir="ltr" className="font-semibold tabular-nums">
                {formatPKR(invoice.amount_paid)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm sm:text-base font-bold border-t border-slate-300 pt-2 text-slate-900">
              <span>{t('invoices.print.balanceDue')}</span>
              <span
                dir="ltr"
                className={
                  balanceDue > 0
                    ? 'text-red-600 tabular-nums'
                    : 'text-emerald-700 tabular-nums'
                }
              >
                {formatPKR(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          {t('invoices.print.thankYouLine')}
        </div>
      </div>
    </div>
  );
}
