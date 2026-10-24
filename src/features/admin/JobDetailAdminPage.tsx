import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  History,
  MessageCircle,
  MessageSquarePlus,
  Pencil,
  Phone,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { getLocalized } from '../../i18n/helpers';
import type {
  FuelType,
  InvoiceRow,
  JobCardRow,
  JobItemRow,
  JobItemType,
  JobNoteRow,
  JobPaymentRow,
  JobStatus,
  JobStatusHistoryRow,
  PaymentMethod,
  ServiceRow,
} from '../../types/database';
import {
  FORWARD_JOB_STAGES,
  JOB_ITEM_TYPES,
  PAYMENT_METHODS,
  formatKarachiDateTime,
  formatPKR,
  getAllowedJobTransitions,
  getInvoiceStatusBadgeVariant,
  getJobStageRank,
  getJobStatusBadgeVariant,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import { notifyAdminJobsUpdated } from './AdminSidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'hybrid', 'cng', 'electric'];

export function JobDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();

  const [job, setJob] = useState<JobCardRow | null>(null);
  const [items, setItems] = useState<JobItemRow[]>([]);
  const [notes, setNotes] = useState<JobNoteRow[]>([]);
  const [history, setHistory] = useState<JobStatusHistoryRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [payments, setPayments] = useState<JobPaymentRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  // Editable job card fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [makeText, setMakeText] = useState('');
  const [modelText, setModelText] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [fuelType, setFuelType] = useState<string>('');
  const [mileageIn, setMileageIn] = useState('');
  const [complaint, setComplaint] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [showCostToCustomer, setShowCostToCustomer] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);

  // Stage transition modal
  const [transitionToStatus, setTransitionToStatus] = useState<JobStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [submittingTransition, setSubmittingTransition] = useState(false);

  // Work item modal / form
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobItemRow | null>(null);
  const [itemType, setItemType] = useState<JobItemType>('labor');
  const [itemServiceId, setItemServiceId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitPrice, setItemUnitPrice] = useState('0');
  const [savingItem, setSavingItem] = useState(false);

  // Progress note form
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteVisible, setNewNoteVisible] = useState(true);
  const [addingNote, setAddingNote] = useState(false);

  // Invoice generation / update form
  const [invoiceDiscountInput, setInvoiceDiscountInput] = useState('0');
  const [invoiceDueDateInput, setInvoiceDueDateInput] = useState('');
  const [invoiceNotesInput, setInvoiceNotesInput] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const populateFormFromJob = useCallback((jc: JobCardRow) => {
    setCustomerName(jc.customer_name || '');
    setCustomerPhone(jc.customer_phone || '');
    setCustomerEmail(jc.customer_email || '');
    setMakeText(jc.make_text || '');
    setModelText(jc.model_text || '');
    setVehicleYear(jc.vehicle_year ? String(jc.vehicle_year) : '');
    setPlateNumber(jc.plate_number || '');
    setFuelType(jc.fuel_type || '');
    setMileageIn(jc.mileage_in !== null && jc.mileage_in !== undefined ? String(jc.mileage_in) : '');
    setComplaint(jc.complaint || '');
    setPublicNote(jc.public_note || '');
    setInternalNotes(jc.internal_notes || '');
    if (jc.estimated_completion) {
      const dt = new Date(jc.estimated_completion);
      if (!Number.isNaN(dt.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        setEstimatedCompletion(
          `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
            dt.getHours()
          )}:${pad(dt.getMinutes())}`
        );
      } else {
        setEstimatedCompletion('');
      }
    } else {
      setEstimatedCompletion('');
    }
    setShowCostToCustomer(Boolean(jc.show_cost_to_customer));
  }, []);

  const loadJobDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (jobError) {
        if (isMissingDatabaseObjectsError(jobError)) {
          setTableMissing(true);
          setLoading(false);
          return;
        }
        throw jobError;
      }

      setTableMissing(false);
      if (!jobData) {
        setJob(null);
        setLoading(false);
        return;
      }

      const typedJob = jobData as JobCardRow;
      setJob(typedJob);
      populateFormFromJob(typedJob);

      const [itemsRes, notesRes, historyRes, invoicesRes, servicesRes] = await Promise.all([
        supabase
          .from('job_items')
          .select('*')
          .eq('job_id', id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('job_notes')
          .select('*')
          .eq('job_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('job_status_history')
          .select('*')
          .eq('job_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('*')
          .eq('job_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
      ]);

      setItems((itemsRes.data as JobItemRow[]) ?? []);
      setNotes((notesRes.data as JobNoteRow[]) ?? []);
      setHistory((historyRes.data as JobStatusHistoryRow[]) ?? []);

      const invList = (invoicesRes.data as InvoiceRow[]) ?? [];
      setInvoices(invList);
      const activeInv = invList.find((inv) => inv.status !== 'void') ?? invList[0];
      if (activeInv) {
        setInvoiceDiscountInput(String(activeInv.discount ?? 0));
        setInvoiceDueDateInput(activeInv.due_date ?? '');
        setInvoiceNotesInput(activeInv.notes ?? '');
      }

      if (invList.length > 0) {
        const invIds = invList.map((inv) => inv.id);
        const { data: pmtData } = await supabase
          .from('job_payments')
          .select('*')
          .in('invoice_id', invIds)
          .order('paid_at', { ascending: false });
        setPayments((pmtData as JobPaymentRow[]) ?? []);
      } else {
        setPayments([]);
      }

      setServices((servicesRes.data as ServiceRow[]) ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [id, populateFormFromJob, t]);

  useEffect(() => {
    void loadJobDetail();
  }, [loadJobDetail]);

  const activeInvoice = useMemo(
    () => invoices.find((inv) => inv.status !== 'void') ?? null,
    [invoices]
  );

  const activeInvoiceBalance = useMemo(() => {
    if (!activeInvoice) return 0;
    return Math.max(Number(activeInvoice.total || 0) - Number(activeInvoice.amount_paid || 0), 0);
  }, [activeInvoice]);

  const itemsSummary = useMemo(() => {
    let subtotal = 0;
    for (const item of items) {
      const line = Number(item.line_total ?? Number(item.quantity) * Number(item.unit_price));
      subtotal += line;
    }
    const discountTotal = Math.max(Number(invoiceDiscountInput || 0), 0);
    const netTotal = Math.max(subtotal - discountTotal, 0);
    return { subtotal, discountTotal, netTotal };
  }, [items, invoiceDiscountInput]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error(t('admin.jobs.validationCustomerRequired'));
      return;
    }

    setSavingDetails(true);
    try {
      const yearNum = vehicleYear.trim() ? Number(vehicleYear.trim()) : null;
      const mileageInNum = mileageIn.trim() ? Number(mileageIn.trim()) : null;
      const estIso = estimatedCompletion.trim()
        ? new Date(estimatedCompletion).toISOString()
        : null;

      const { data, error } = await supabase
        .from('job_cards')
        .update({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          make_text: makeText.trim() || null,
          model_text: modelText.trim() || null,
          vehicle_year: yearNum,
          plate_number: plateNumber.trim() || null,
          fuel_type: (fuelType || null) as FuelType | null,
          mileage_in: mileageInNum,
          complaint: complaint.trim() || null,
          public_note: publicNote.trim() || null,
          internal_notes: internalNotes.trim() || null,
          estimated_completion: estIso,
          show_cost_to_customer: showCostToCustomer,
        })
        .eq('id', job.id)
        .select('*')
        .single();

      if (error) throw error;
      setJob(data as JobCardRow);
      toast.success(t('admin.jobs.savedSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !transitionToStatus) return;

    setSubmittingTransition(true);
    try {
      const { error } = await supabase.rpc('admin_update_job_status', {
        p_job_id: job.id,
        p_status: transitionToStatus,
        p_note: transitionNote.trim() || null,
      });

      if (error) throw error;

      toast.success(
        t('admin.jobs.statusUpdatedToast', {
          jobNo: job.job_no,
          status: t(`jobs.status.${transitionToStatus}`),
        })
      );
      setTransitionToStatus(null);
      setTransitionNote('');
      notifyAdminJobsUpdated();
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmittingTransition(false);
    }
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemType('labor');
    setItemServiceId('');
    setItemDescription('');
    setItemQuantity('1');
    setItemUnitPrice('0');
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: JobItemRow) => {
    setEditingItem(item);
    setItemType(item.item_type);
    setItemServiceId(item.service_id || '');
    setItemDescription(item.description);
    setItemQuantity(String(item.quantity));
    setItemUnitPrice(String(item.unit_price));
    setItemModalOpen(true);
  };

  const handleSelectServicePreset = (serviceId: string) => {
    setItemServiceId(serviceId);
    if (!serviceId) return;
    const svc = services.find((s) => s.id === serviceId);
    if (svc) {
      const name = getLocalized(svc, 'name', i18n.language);
      setItemDescription(name);
      setItemType('service');
      if (svc.price_from !== null && svc.price_from !== undefined) {
        setItemUnitPrice(String(svc.price_from));
      }
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    const qty = Number(itemQuantity);
    const price = Number(itemUnitPrice);
    if (
      !itemDescription.trim() ||
      Number.isNaN(qty) ||
      qty <= 0 ||
      Number.isNaN(price) ||
      price < 0
    ) {
      toast.error(t('admin.jobs.validationItemInvalid'));
      return;
    }

    setSavingItem(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('job_items')
          .update({
            item_type: itemType,
            service_id: itemServiceId || null,
            description: itemDescription.trim(),
            quantity: qty,
            unit_price: price,
          })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(t('admin.jobs.itemUpdatedToast'));
      } else {
        const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 10 : 10;
        const { error } = await supabase.from('job_items').insert({
          job_id: job.id,
          item_type: itemType,
          service_id: itemServiceId || null,
          description: itemDescription.trim(),
          quantity: qty,
          unit_price: price,
          sort_order: nextSort,
        });
        if (error) throw error;
        toast.success(t('admin.jobs.itemAddedToast'));
      }

      setItemModalOpen(false);
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: JobItemRow) => {
    try {
      const { error } = await supabase.from('job_items').delete().eq('id', item.id);
      if (error) throw error;
      toast.success(t('admin.jobs.itemDeletedToast'));
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !newNoteText.trim()) return;

    setAddingNote(true);
    try {
      const { error } = await supabase.from('job_notes').insert({
        job_id: job.id,
        note: newNoteText.trim(),
        is_customer_visible: newNoteVisible,
        created_by: null,
      });
      if (error) throw error;
      setNewNoteText('');
      toast.success(t('admin.jobs.noteAddedToast'));
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setAddingNote(false);
    }
  };

  const handleToggleNoteVisibility = async (note: JobNoteRow) => {
    try {
      const { error } = await supabase
        .from('job_notes')
        .update({ is_customer_visible: !note.is_customer_visible })
        .eq('id', note.id);
      if (error) throw error;
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('job_notes').delete().eq('id', noteId);
      if (error) throw error;
      toast.success(t('admin.jobs.noteDeletedToast'));
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const handleGenerateOrUpdateInvoice = async (issueNow: boolean) => {
    if (!job) return;
    setGeneratingInvoice(true);
    try {
      const discountNum = Math.max(Number(invoiceDiscountInput || 0), 0);
      const dueDateVal = invoiceDueDateInput.trim() || null;
      const notesVal = invoiceNotesInput.trim() || null;

      if (issueNow) {
        const { error } = await supabase.rpc('admin_issue_invoice', {
          p_job_id: job.id,
          p_discount: discountNum,
          p_due_date: dueDateVal,
          p_notes: notesVal,
        });
        if (error) throw error;
        toast.success(t('admin.jobs.invoiceIssuedToast'));
      } else {
        const { error } = await supabase.rpc('admin_save_draft_invoice', {
          p_job_id: job.id,
          p_discount: discountNum,
          p_due_date: dueDateVal,
          p_notes: notesVal,
        });
        if (error) throw error;
        toast.success(t('admin.jobs.invoiceSavedToast'));
      }

      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const openRecordPaymentModal = () => {
    if (!activeInvoice) return;
    setPaymentAmount(String(activeInvoiceBalance || 0));
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    const amt = Number(paymentAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error(t('admin.invoices.invalidPaymentAmount'));
      return;
    }

    setRecordingPayment(true);
    try {
      const { error } = await supabase.rpc('admin_record_payment', {
        p_invoice_id: activeInvoice.id,
        p_amount: amt,
        p_method: paymentMethod,
        p_reference: paymentReference.trim() || null,
        p_note: paymentNotes.trim() || null,
      });

      if (error) throw error;
      toast.success(t('admin.invoices.paymentRecordedToast'));
      setPaymentModalOpen(false);
      await loadJobDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setRecordingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-slate-200" />
        <Skeleton className="h-28 w-full bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 bg-slate-200" />
          <Skeleton className="h-96 bg-slate-200" />
        </div>
      </div>
    );
  }

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

  if (!job) {
    return (
      <Card variant="light" className="text-center space-y-4">
        <ClipboardList className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#12151A]">{t('admin.jobs.notFoundTitle')}</h2>
        <Link to="/admin/jobs">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}>
            {t('admin.jobs.backToJobs')}
          </Button>
        </Link>
      </Card>
    );
  }

  const allowedTransitions = getAllowedJobTransitions(job.status);
  const currentStageRank = getJobStageRank(job.status);
  const whatsappUrl = buildWhatsAppUrl(
    job.customer_phone,
    t('admin.jobs.whatsappCustomerUpdate', {
      name: job.customer_name,
      jobNo: job.job_no,
      status: t(`jobs.status.${job.status}`),
    })
  );

  return (
    <div className="space-y-6 text-start">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/jobs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#12151A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip" />
              {t('admin.jobs.backToJobs')}
            </Link>
            <span className="text-slate-300">/</span>
            <span dir="ltr" className="text-xs font-bold text-[#FF6A00] tabular-nums">
              {job.job_no}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1
              dir="ltr"
              className="text-2xl sm:text-3xl font-bold font-heading text-[#12151A] tabular-nums"
            >
              {job.job_no}
            </h1>
            <Badge variant={getJobStatusBadgeVariant(job.status)}>
              {t(`jobs.status.${job.status}`)}
            </Badge>
            {job.is_demo && <Badge variant="warning">{t('admin.bookings.demoBadge')}</Badge>}
            {job.booking_id && (
              <Link
                to="/admin/bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6A00] hover:underline"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                {t('admin.jobs.linkedBookingBadge')}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href={`tel:${job.customer_phone}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-300 text-[#12151A] hover:bg-slate-100"
              leftIcon={<Phone className="w-4 h-4 text-[#FF6A00]" />}
            >
              <span dir="ltr" className="tabular-nums">
                {job.customer_phone}
              </span>
            </Button>
          </a>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
            >
              WhatsApp
            </Button>
          </a>

          {activeInvoice && (
            <Link to={`/invoice/${activeInvoice.id}/print`}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                {t('jobs.printInvoice')} ({activeInvoice.invoice_no})
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stage Stepper + Transition Buttons */}
      <Card variant="light" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-[#12151A]">
              {t('admin.jobs.stagePipelineTitle')}
            </h2>
            <p className="text-xs text-slate-600">
              {t('jobs.receivedAt')}: <span dir="ltr">{formatKarachiDateTime(job.received_at)}</span>
              {job.delivered_at && (
                <>
                  {' · '}
                  {t('jobs.deliveredAt')}:{' '}
                  <span dir="ltr">{formatKarachiDateTime(job.delivered_at)}</span>
                </>
              )}
            </p>
          </div>

          {allowedTransitions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {t('admin.jobs.moveStageLabel')}:
              </span>
              {allowedTransitions.map((nextStatus: JobStatus) => (
                <Button
                  key={nextStatus}
                  type="button"
                  variant={
                    nextStatus === 'cancelled'
                      ? 'danger'
                      : nextStatus === 'on_hold'
                      ? 'outline'
                      : 'primary'
                  }
                  size="sm"
                  className={
                    nextStatus === 'on_hold'
                      ? 'border-amber-400 text-amber-800 hover:bg-amber-50'
                      : undefined
                  }
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl-flip" />}
                  onClick={() => {
                    setTransitionToStatus(nextStatus);
                    setTransitionNote('');
                  }}
                >
                  {t(`jobs.status.${nextStatus}`)}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 7-stage visual progress bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {FORWARD_JOB_STAGES.map((stage, idx) => {
            const stageRank = idx + 1;
            const isCompleted =
              (currentStageRank !== null && currentStageRank > stageRank) ||
              job.status === 'delivered';
            const isCurrent = job.status === stage;
            return (
              <div
                key={stage}
                className={`rounded-md border p-2.5 text-start transition-colors ${
                  isCurrent
                    ? 'border-[#FF6A00] bg-[#FF6A00]/10 text-[#12151A]'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold tabular-nums">{stageRank}</span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {isCurrent && <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />}
                </div>
                <p className="text-xs font-semibold leading-snug">{t(`jobs.status.${stage}`)}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Work Items, Invoice & Payments, Customer & Vehicle Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Items & Cost Breakdown */}
          <Card variant="light" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-[#12151A] flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#FF6A00]" />
                  {t('admin.jobs.workItemsTitle')}
                </h2>
                <p className="text-xs text-slate-600">{t('admin.jobs.workItemsSubtitle')}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={showCostToCustomer ? 'success' : 'neutral'}>
                  {showCostToCustomer ? (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {t('admin.jobs.costsVisibleBadge')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      {t('admin.jobs.costsHiddenBadge')}
                    </span>
                  )}
                </Badge>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={openAddItemModal}
                >
                  {t('admin.jobs.addWorkItem')}
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700">{t('jobs.noItemsYet')}</p>
                <p className="text-xs text-slate-500">{t('admin.jobs.noItemsHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 px-3 text-start">{t('jobs.itemTypeLabel')}</th>
                      <th className="py-2.5 px-3 text-start">{t('jobs.itemDescription')}</th>
                      <th className="py-2.5 px-3 text-end">{t('jobs.itemQty')}</th>
                      <th className="py-2.5 px-3 text-end">{t('jobs.itemUnitPrice')}</th>
                      <th className="py-2.5 px-3 text-end">{t('jobs.itemLineTotal')}</th>
                      <th className="py-2.5 px-3 text-end">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <Badge variant="neutral">{t(`jobs.itemType.${item.item_type}`)}</Badge>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#12151A]">
                          {item.description}
                        </td>
                        <td dir="ltr" className="py-2.5 px-3 text-end tabular-nums text-slate-700">
                          {item.quantity}
                        </td>
                        <td dir="ltr" className="py-2.5 px-3 text-end tabular-nums text-slate-700">
                          {formatPKR(item.unit_price)}
                        </td>
                        <td
                          dir="ltr"
                          className="py-2.5 px-3 text-end font-semibold tabular-nums text-[#12151A]"
                        >
                          {formatPKR(Number(item.line_total))}
                        </td>
                        <td className="py-2.5 px-3 text-end">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditItemModal(item)}
                              className="p-1.5 rounded text-slate-500 hover:text-[#12151A] hover:bg-slate-200/60"
                              title={t('common.edit')}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteItem(item)}
                              className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals bar */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 rounded-lg p-4">
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>
                  {t('jobs.invoiceSubtotal')}:{' '}
                  <strong dir="ltr" className="text-[#12151A] tabular-nums">
                    {formatPKR(itemsSummary.subtotal)}
                  </strong>
                </p>
                {itemsSummary.discountTotal > 0 && (
                  <p>
                    {t('jobs.invoiceDiscount')}:{' '}
                    <strong dir="ltr" className="text-amber-700 tabular-nums">
                      - {formatPKR(itemsSummary.discountTotal)}
                    </strong>
                  </p>
                )}
              </div>
              <div className="text-end">
                <span className="text-xs uppercase tracking-wider text-slate-500 block">
                  {t('admin.jobs.estimatedNetTotal')}
                </span>
                <span
                  dir="ltr"
                  className="text-xl font-bold font-heading text-[#12151A] tabular-nums"
                >
                  {formatPKR(itemsSummary.netTotal)}
                </span>
              </div>
            </div>
          </Card>

          {/* Invoice & Payments Section */}
          <Card variant="light" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold font-heading text-[#12151A] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#FF6A00]" />
                  {t('admin.jobs.invoiceSectionTitle')}
                </h2>
                <p className="text-xs text-slate-600">{t('admin.jobs.invoiceSectionSubtitle')}</p>
              </div>

              {activeInvoice && (
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="text-sm font-bold text-[#12151A] tabular-nums">
                    {activeInvoice.invoice_no}
                  </span>
                  <Badge variant={getInvoiceStatusBadgeVariant(activeInvoice.status)}>
                    {t(`jobs.invoiceStatus.${activeInvoice.status}`)}
                  </Badge>
                  <Link to={`/invoice/${activeInvoice.id}/print`}>
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
                </div>
              )}
            </div>

            {activeInvoice && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">{t('jobs.invoiceTotal')}</span>
                  <span dir="ltr" className="text-base font-bold text-[#12151A] tabular-nums">
                    {formatPKR(activeInvoice.total)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">{t('jobs.invoicePaid')}</span>
                  <span dir="ltr" className="text-base font-bold text-emerald-700 tabular-nums">
                    {formatPKR(activeInvoice.amount_paid)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">{t('jobs.invoiceBalanceDue')}</span>
                  <span
                    dir="ltr"
                    className={`text-base font-bold tabular-nums ${
                      activeInvoiceBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatPKR(activeInvoiceBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    {t('admin.invoices.issuedDate')}
                  </span>
                  <span dir="ltr" className="text-xs font-semibold text-slate-700 tabular-nums">
                    {activeInvoice.issued_at
                      ? formatKarachiDateTime(activeInvoice.issued_at)
                      : t('jobs.invoiceStatus.draft')}
                  </span>
                </div>
              </div>
            )}

            {/* Generate / Sync Invoice Form */}
            {(!activeInvoice ||
              activeInvoice.status === 'draft' ||
              activeInvoice.status === 'issued') && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    lightMode
                    type="number"
                    min="0"
                    step="1"
                    label={t('jobs.invoiceDiscount')}
                    value={invoiceDiscountInput}
                    onChange={(e) => setInvoiceDiscountInput(e.target.value)}
                  />
                  <Input
                    lightMode
                    dir="ltr"
                    type="date"
                    label={t('jobs.invoiceDueDate')}
                    value={invoiceDueDateInput}
                    onChange={(e) => setInvoiceDueDateInput(e.target.value)}
                  />
                </div>
                <Textarea
                  lightMode
                  rows={2}
                  label={t('admin.jobs.invoiceNotesLabel')}
                  value={invoiceNotesInput}
                  onChange={(e) => setInvoiceNotesInput(e.target.value)}
                  placeholder={t('admin.jobs.invoiceNotesPlaceholder')}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-[#12151A] hover:bg-slate-100"
                    isLoading={generatingInvoice}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => void handleGenerateOrUpdateInvoice(false)}
                  >
                    {activeInvoice
                      ? t('admin.jobs.syncInvoiceDraft')
                      : t('admin.jobs.createDraftInvoice')}
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={generatingInvoice}
                    leftIcon={<FileText className="w-4 h-4" />}
                    onClick={() => void handleGenerateOrUpdateInvoice(true)}
                  >
                    {activeInvoice && activeInvoice.status === 'issued'
                      ? t('admin.jobs.reissueSyncInvoice')
                      : t('admin.jobs.issueInvoiceNow')}
                  </Button>

                  {activeInvoice && activeInvoiceBalance > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<CreditCard className="w-4 h-4 text-emerald-400" />}
                      onClick={openRecordPaymentModal}
                    >
                      {t('admin.invoices.recordPayment')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeInvoice &&
              activeInvoice.status !== 'draft' &&
              activeInvoice.status !== 'issued' &&
              activeInvoiceBalance > 0 && (
                <div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<CreditCard className="w-4 h-4" />}
                    onClick={openRecordPaymentModal}
                  >
                    {t('admin.invoices.recordPayment')}
                  </Button>
                </div>
              )}

            {/* Recorded Payments List */}
            {payments.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('jobs.paymentHistoryTitle')}
                </h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {payments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="success">{t(`jobs.paymentMethod.${pmt.method}`)}</Badge>
                          {pmt.reference && (
                            <span dir="ltr" className="text-slate-600 font-mono">
                              #{pmt.reference}
                            </span>
                          )}
                        </div>
                        {pmt.note && <p className="text-slate-600">{pmt.note}</p>}
                      </div>
                      <div className="text-end">
                        <span dir="ltr" className="font-bold text-emerald-700 tabular-nums block">
                          {formatPKR(pmt.amount)}
                        </span>
                        <span dir="ltr" className="text-[11px] text-slate-500 tabular-nums">
                          {formatKarachiDateTime(pmt.paid_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Editable Customer, Vehicle & Workshop Details Form */}
          <Card variant="light">
            <form onSubmit={handleSaveDetails} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-bold font-heading text-[#12151A] flex items-center gap-2">
                    <Car className="w-5 h-5 text-[#FF6A00]" />
                    {t('admin.jobs.jobDetailsFormTitle')}
                  </h2>
                  <p className="text-xs text-slate-600">{t('admin.jobs.jobDetailsFormSubtitle')}</p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingDetails}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {t('common.saveChanges')}
                </Button>
              </div>

              {/* Customer Visibility Toggle for Item Prices */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label
                    htmlFor="show-cost-toggle"
                    className="text-sm font-bold text-[#12151A] cursor-pointer"
                  >
                    {t('admin.jobs.showCostToCustomerLabel')}
                  </label>
                  <p className="text-xs text-slate-600">{t('admin.jobs.showCostToCustomerHint')}</p>
                </div>
                <input
                  id="show-cost-toggle"
                  type="checkbox"
                  checked={showCostToCustomer}
                  onChange={(e) => setShowCostToCustomer(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  lightMode
                  required
                  label={t('booking.customerName')}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  lightMode
                  required
                  dir="ltr"
                  label={t('booking.customerPhone')}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <Input
                  lightMode
                  dir="ltr"
                  type="email"
                  label={t('booking.customerEmail')}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  lightMode
                  label={t('booking.make')}
                  value={makeText}
                  onChange={(e) => setMakeText(e.target.value)}
                />
                <Input
                  lightMode
                  label={t('booking.model')}
                  value={modelText}
                  onChange={(e) => setModelText(e.target.value)}
                />
                <Input
                  lightMode
                  dir="ltr"
                  type="number"
                  label={t('booking.year')}
                  value={vehicleYear}
                  onChange={(e) => setVehicleYear(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  lightMode
                  dir="ltr"
                  label={t('booking.plateNumber')}
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
                <Select
                  lightMode
                  label={t('booking.fuelType')}
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  options={[
                    { value: '', label: t('common.optional') },
                    ...FUEL_TYPES.map((ft) => ({
                      value: ft,
                      label: t(`booking.fuelTypes.${ft}`),
                    })),
                  ]}
                />
                <Input
                  lightMode
                  dir="ltr"
                  type="number"
                  label={t('jobs.mileageIn')}
                  value={mileageIn}
                  onChange={(e) => setMileageIn(e.target.value)}
                />
              </div>

              <Input
                lightMode
                dir="ltr"
                type="datetime-local"
                label={t('jobs.estimatedCompletion')}
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
              />

              <Textarea
                lightMode
                rows={2}
                label={t('jobs.complaintLabel')}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
              />

              <Textarea
                lightMode
                rows={2}
                label={t('admin.jobs.publicAdvisorNoteLabel')}
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder={t('admin.jobs.publicAdvisorNotePlaceholder')}
              />

              <Textarea
                lightMode
                rows={2}
                label={t('admin.jobs.internalNotesLabel')}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder={t('admin.jobs.internalNotesPlaceholder')}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={savingDetails}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {t('common.saveChanges')}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Progress Notes + Status History */}
        <div className="space-y-6">
          {/* Progress Notes */}
          <Card variant="light" className="space-y-4">
            <h2 className="text-lg font-bold font-heading text-[#12151A] flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-[#FF6A00]" />
              {t('jobs.progressNotesTitle')}
            </h2>

            <form onSubmit={handleAddNote} className="space-y-3 border-b border-slate-200 pb-4">
              <Textarea
                lightMode
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={t('admin.jobs.newNotePlaceholder')}
              />
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNoteVisible}
                    onChange={(e) => setNewNoteVisible(e.target.checked)}
                    className="rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                  />
                  {t('admin.jobs.noteVisibleToCustomer')}
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={addingNote}
                  disabled={!newNoteText.trim()}
                >
                  {t('admin.jobs.addNoteBtn')}
                </Button>
              </div>
            </form>

            {notes.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">{t('jobs.noNotesYet')}</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 space-y-2 text-xs ${
                      n.is_customer_visible
                        ? 'border-slate-200 bg-white'
                        : 'border-amber-200 bg-amber-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={n.is_customer_visible ? 'info' : 'warning'}>
                        {n.is_customer_visible
                          ? t('admin.jobs.customerVisibleBadge')
                          : t('admin.jobs.internalOnlyBadge')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleToggleNoteVisibility(n)}
                          className="p-1 rounded text-slate-500 hover:text-[#12151A]"
                          title={t('admin.jobs.toggleVisibility')}
                        >
                          {n.is_customer_visible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteNote(n.id)}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{n.note}</p>
                    <p dir="ltr" className="text-[11px] text-slate-400 tabular-nums">
                      {formatKarachiDateTime(n.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status History Timeline */}
          <Card variant="light" className="space-y-4">
            <h2 className="text-lg font-bold font-heading text-[#12151A] flex items-center gap-2">
              <History className="w-5 h-5 text-[#FF6A00]" />
              {t('jobs.timelineTitle')}
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">{t('jobs.noHistoryYet')}</p>
            ) : (
              <ol className="relative border-s border-slate-200 ms-3 space-y-4">
                {history.map((h) => (
                  <li key={h.id} className="ms-4 space-y-1">
                    <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-[#FF6A00] border-2 border-white" />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {h.from_status && (
                        <>
                          <Badge variant="neutral">{t(`jobs.status.${h.from_status}`)}</Badge>
                          <ArrowRight className="w-3 h-3 text-slate-400 rtl-flip" />
                        </>
                      )}
                      <Badge variant={getJobStatusBadgeVariant(h.to_status)}>
                        {t(`jobs.status.${h.to_status}`)}
                      </Badge>
                    </div>
                    {h.note && <p className="text-xs text-slate-700">{h.note}</p>}
                    <p dir="ltr" className="text-[11px] text-slate-400 tabular-nums">
                      {formatKarachiDateTime(h.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Linked Customer Summary */}
          <Card variant="light" className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <User className="w-4 h-4 text-[#FF6A00]" />
              {t('admin.jobs.customerAccountSection')}
            </div>
            <p className="text-xs text-slate-700">
              {job.user_id
                ? t('admin.jobs.linkedCustomerAccount')
                : t('admin.jobs.guestWalkInCustomer')}
            </p>
          </Card>
        </div>
      </div>

      {/* Stage Transition Modal */}
      <Modal
        isOpen={Boolean(transitionToStatus)}
        onClose={() => setTransitionToStatus(null)}
        title={t('admin.jobs.confirmStageChangeTitle')}
      >
        {transitionToStatus && (
          <form onSubmit={handleConfirmTransition} className="space-y-4 text-start">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={getJobStatusBadgeVariant(job.status)}>
                {t(`jobs.status.${job.status}`)}
              </Badge>
              <ArrowRight className="w-4 h-4 text-slate-400 rtl-flip" />
              <Badge variant={getJobStatusBadgeVariant(transitionToStatus)}>
                {t(`jobs.status.${transitionToStatus}`)}
              </Badge>
            </div>

            <Textarea
              rows={3}
              label={t('admin.jobs.stageTransitionNoteLabel')}
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder={t('admin.jobs.stageTransitionNotePlaceholder')}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTransitionToStatus(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={submittingTransition}>
                {t('common.confirm')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add / Edit Work Item Modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItem ? t('admin.jobs.editWorkItem') : t('admin.jobs.addWorkItem')}
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-start">
          <Select
            label={t('jobs.itemTypeLabel')}
            value={itemType}
            onChange={(e) => setItemType(e.target.value as JobItemType)}
            options={JOB_ITEM_TYPES.map((it) => ({
              value: it,
              label: t(`jobs.itemType.${it}`),
            }))}
          />

          {services.length > 0 && (
            <Select
              label={t('admin.jobs.prefillFromService')}
              value={itemServiceId}
              onChange={(e) => handleSelectServicePreset(e.target.value)}
              options={[
                { value: '', label: t('common.optional') },
                ...services.map((svc) => ({
                  value: svc.id,
                  label: `${getLocalized(svc, 'name', i18n.language)}${
                    svc.price_from ? ` (${formatPKR(svc.price_from)})` : ''
                  }`,
                })),
              ]}
            />
          )}

          <Input
            required
            label={t('jobs.itemDescription')}
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              required
              dir="ltr"
              type="number"
              min="0.01"
              step="0.01"
              label={t('jobs.itemQty')}
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
            />
            <Input
              required
              dir="ltr"
              type="number"
              min="0"
              step="1"
              label={t('jobs.itemUnitPrice')}
              value={itemUnitPrice}
              onChange={(e) => setItemUnitPrice(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItemModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingItem}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={t('admin.invoices.recordPayment')}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-start">
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
              onClick={() => setPaymentModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={recordingPayment}>
              {t('admin.invoices.recordPayment')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default JobDetailAdminPage;
