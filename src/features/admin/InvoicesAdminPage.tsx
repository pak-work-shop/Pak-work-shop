import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Printer,
  Receipt,
  RefreshCw,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type {
  InvoiceRow,
  InvoiceStatus,
  JobCardRow,
  PaymentMethod,
} from '../../types/database';
import {
  PAYMENT_METHODS,
  formatKarachiDateTime,
  formatPKR,
  getInvoiceStatusBadgeVariant,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

type InvoiceWithJob = InvoiceRow & {
  job?: Pick<
    JobCardRow,
    | 'id'
    | 'job_no'
    | 'customer_name'
    | 'customer_phone'
    | 'make_text'
    | 'model_text'
    | 'plate_number'
    | 'is_demo'
  > | null;
};

const INVOICE_STATUS_FILTERS: Array<'all' | InvoiceStatus> = [
  'all',
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'void',
];

function getInvoiceBalance(inv: InvoiceRow): number {
  return Math.max(Number(inv.total || 0) - Number(inv.amount_paid || 0), 0);
}

export function InvoicesAdminPage() {
  const { t } = useTranslation();

  const [invoices, setInvoices] = useState<InvoiceWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Record payment modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithJob | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) {
        if (isMissingDatabaseObjectsError(invError)) {
          setTableMissing(true);
          setInvoices([]);
          setLoading(false);
          return;
        }
        throw invError;
      }

      setTableMissing(false);
      const rawInvoices = (invData as InvoiceRow[]) ?? [];
      if (rawInvoices.length === 0) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      const jobIds = Array.from(new Set(rawInvoices.map((inv) => inv.job_id)));
      const { data: jobsData } = await supabase
        .from('job_cards')
        .select(
          'id, job_no, customer_name, customer_phone, make_text, model_text, plate_number, is_demo'
        )
        .in('id', jobIds);

      const jobMap = new Map<string, InvoiceWithJob['job']>();
      for (const jc of (jobsData ?? []) as Array<NonNullable<InvoiceWithJob['job']>>) {
        jobMap.set(jc.id, jc);
      }

      setInvoices(
        rawInvoices.map((inv) => ({
          ...inv,
          job: jobMap.get(inv.job_id) ?? null,
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const fields = [
        inv.invoice_no,
        inv.job?.job_no,
        inv.job?.customer_name,
        inv.job?.customer_phone,
        inv.job?.plate_number,
        inv.job?.make_text,
        inv.job?.model_text,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fields.includes(q);
    });
  }, [invoices, searchQuery, statusFilter]);

  const kpis = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalBalanceDue = 0;

    for (const inv of invoices) {
      if (inv.status === 'void') continue;
      if (inv.status !== 'draft') {
        totalBilled += Number(inv.total || 0);
        totalBalanceDue += getInvoiceBalance(inv);
      }
      totalCollected += Number(inv.amount_paid || 0);
    }

    return {
      totalBilled,
      totalCollected,
      totalBalanceDue,
      count: invoices.length,
    };
  }, [invoices]);

  const openPaymentModal = (inv: InvoiceWithJob) => {
    setSelectedInvoice(inv);
    setPaymentAmount(String(getInvoiceBalance(inv)));
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = Number(paymentAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error(t('admin.invoices.invalidPaymentAmount'));
      return;
    }

    setSubmittingPayment(true);
    try {
      const { error } = await supabase.rpc('admin_record_payment', {
        p_invoice_id: selectedInvoice.id,
        p_amount: amt,
        p_method: paymentMethod,
        p_reference: paymentReference.trim() || null,
        p_note: paymentNotes.trim() || null,
      });

      if (error) throw error;
      toast.success(t('admin.invoices.paymentRecordedToast'));
      setSelectedInvoice(null);
      await loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleIssueDraftInvoice = async (inv: InvoiceWithJob) => {
    try {
      const { error } = await supabase.rpc('admin_issue_invoice', {
        p_job_id: inv.job_id,
        p_discount: Number(inv.discount || 0),
        p_due_date: inv.due_date || null,
        p_notes: inv.notes || null,
      });
      if (error) throw error;
      toast.success(t('admin.jobs.invoiceIssuedToast'));
      await loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleVoidInvoice = async (inv: InvoiceWithJob) => {
    if (Number(inv.amount_paid) > 0) {
      toast.error(t('admin.invoices.cannotVoidPaidInvoice'));
      return;
    }
    try {
      const { error } = await supabase.rpc('admin_void_invoice', {
        p_invoice_id: inv.id,
        p_note: null,
      });
      if (error) throw error;
      toast.success(t('admin.invoices.invoiceVoidedToast'));
      await loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (tableMissing) {
    return (
      <Card variant="light" className="border-amber-300 bg-amber-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2 text-start">
            <h2 className="text-lg font-bold text-amber-950">
              {t('admin.jobs.setupRequiredTitle')}
            </h2>
            <p className="text-sm text-amber-900">{t('admin.jobs.setupRequiredBody')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#12151A]">
            {t('admin.invoices.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{t('admin.invoices.subtitle')}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 text-[#12151A] hover:bg-slate-100"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => void loadInvoices()}
        >
          {t('common.refresh')}
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="light" className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t('admin.invoices.totalBilled')}
          </span>
          <p dir="ltr" className="text-2xl font-bold font-heading text-[#12151A] tabular-nums">
            {formatPKR(kpis.totalBilled)}
          </p>
        </Card>

        <Card variant="light" className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t('admin.invoices.totalCollected')}
          </span>
          <p dir="ltr" className="text-2xl font-bold font-heading text-emerald-700 tabular-nums">
            {formatPKR(kpis.totalCollected)}
          </p>
        </Card>

        <Card variant="light" className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t('admin.invoices.unpaidBalance')}
          </span>
          <p dir="ltr" className="text-2xl font-bold font-heading text-amber-700 tabular-nums">
            {formatPKR(kpis.totalBalanceDue)}
          </p>
        </Card>

        <Card variant="light" className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t('admin.invoices.totalInvoices')}
          </span>
          <p dir="ltr" className="text-2xl font-bold font-heading text-[#12151A] tabular-nums">
            {kpis.count}
          </p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card variant="light" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {INVOICE_STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-[#12151A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? t('common.all') : t(`jobs.invoiceStatus.${st}`)}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 pointer-events-none absolute top-1/2 start-3.5 -translate-y-1/2" />
            <Input
              lightMode
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.invoices.searchPlaceholder')}
              className="ps-9"
            />
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-200" />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card variant="light" className="text-center py-12 space-y-2">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#12151A]">{t('admin.invoices.emptyTitle')}</h3>
          <p className="text-xs text-slate-500">{t('admin.invoices.emptySubtitle')}</p>
        </Card>
      ) : (
        <Card variant="light" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4 text-start">{t('jobs.invoiceNo')}</th>
                  <th className="py-3 px-4 text-start">{t('jobs.jobNo')}</th>
                  <th className="py-3 px-4 text-start">{t('booking.customerName')}</th>
                  <th className="py-3 px-4 text-start">{t('common.status')}</th>
                  <th className="py-3 px-4 text-end">{t('jobs.invoiceTotal')}</th>
                  <th className="py-3 px-4 text-end">{t('jobs.invoicePaid')}</th>
                  <th className="py-3 px-4 text-end">{t('jobs.invoiceBalanceDue')}</th>
                  <th className="py-3 px-4 text-start">{t('admin.invoices.issuedDate')}</th>
                  <th className="py-3 px-4 text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((inv) => {
                  const balance = getInvoiceBalance(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            dir="ltr"
                            className="font-bold font-heading text-[#12151A] tabular-nums"
                          >
                            {inv.invoice_no}
                          </span>
                          {inv.is_demo && (
                            <Badge variant="warning">{t('admin.bookings.demoBadge')}</Badge>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/jobs/${inv.job_id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#FF6A00] hover:underline"
                        >
                          <span dir="ltr" className="tabular-nums">
                            {inv.job?.job_no || 'Job'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#12151A]">
                          {inv.job?.customer_name || '—'}
                        </div>
                        {inv.job?.customer_phone && (
                          <div dir="ltr" className="text-xs text-slate-500 tabular-nums">
                            {inv.job.customer_phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={getInvoiceStatusBadgeVariant(inv.status)}>
                          {t(`jobs.invoiceStatus.${inv.status}`)}
                        </Badge>
                      </td>

                      <td dir="ltr" className="py-3.5 px-4 text-end font-semibold tabular-nums">
                        {formatPKR(inv.total)}
                      </td>

                      <td
                        dir="ltr"
                        className="py-3.5 px-4 text-end font-medium text-emerald-700 tabular-nums"
                      >
                        {formatPKR(inv.amount_paid)}
                      </td>

                      <td
                        dir="ltr"
                        className={`py-3.5 px-4 text-end font-bold tabular-nums ${
                          balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatPKR(balance)}
                      </td>

                      <td dir="ltr" className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                        {inv.issued_at
                          ? formatKarachiDateTime(inv.issued_at)
                          : formatKarachiDateTime(inv.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <Link to={`/invoice/${inv.id}/print`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-slate-300 text-[#12151A] hover:bg-slate-100"
                              leftIcon={<Printer className="w-3.5 h-3.5" />}
                            >
                              {t('jobs.printInvoice')}
                            </Button>
                          </Link>

                          {inv.status === 'draft' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              leftIcon={<FileText className="w-3.5 h-3.5" />}
                              onClick={() => void handleIssueDraftInvoice(inv)}
                            >
                              {t('admin.jobs.issueInvoiceNow')}
                            </Button>
                          )}

                          {inv.status !== 'void' && balance > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              leftIcon={<CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                              onClick={() => openPaymentModal(inv)}
                            >
                              {t('admin.invoices.recordPayment')}
                            </Button>
                          )}

                          {(inv.status === 'draft' || inv.status === 'issued') &&
                            Number(inv.amount_paid) === 0 && (
                              <button
                                type="button"
                                onClick={() => void handleVoidInvoice(inv)}
                                className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                                title={t('admin.invoices.voidInvoice')}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={
          selectedInvoice
            ? `${t('admin.invoices.recordPayment')} — ${selectedInvoice.invoice_no}`
            : t('admin.invoices.recordPayment')
        }
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-start">
            <div className="rounded-lg bg-[#2A2F38] border border-white/15 p-3 flex items-center justify-between text-xs">
              <span className="text-[#8A93A3]">{t('jobs.invoiceBalanceDue')}:</span>
              <strong dir="ltr" className="text-sm text-amber-400 tabular-nums">
                {formatPKR(getInvoiceBalance(selectedInvoice))}
              </strong>
            </div>

            <Input
              required
              dir="ltr"
              type="number"
              min="1"
              step="1"
              label={t('admin.invoices.paymentAmountPkr')}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />

            <Select
              label={t('admin.invoices.paymentMethodLabel')}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              options={PAYMENT_METHODS.map((pm) => ({
                value: pm,
                label: t(`jobs.paymentMethod.${pm}`),
              }))}
            />

            <Input
              dir="ltr"
              label={t('admin.invoices.paymentReferenceLabel')}
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="TXN / Receipt #"
            />

            <Textarea
              rows={2}
              label={t('admin.invoices.paymentNotesLabel')}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submittingPayment}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {t('admin.invoices.recordPayment')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default InvoicesAdminPage;
