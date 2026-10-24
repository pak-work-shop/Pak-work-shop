import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  Car,
  Columns3,
  FlaskConical,
  List,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { normalizePakPhoneInput, PAK_MOBILE_REGEX } from '../../lib/validators';
import { getLocalized } from '../../i18n/helpers';
import { useServices } from '../services/useServices';
import { useVehicleCatalog } from '../booking/useBookingData';
import { getKarachiNowParts } from '../booking/bookingUtils';
import {
  ALL_JOB_STATUSES,
  formatKarachiDateTime,
  getAllowedJobTransitions,
  getJobStatusBadgeVariant,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import { notifyAdminJobsUpdated } from './AdminSidebar';
import type { FuelType, JobCardRow, JobStatus } from '../../types/database';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { cn } from '../../lib/utils';

const BOARD_COLUMNS: JobStatus[] = [
  'received',
  'inspection',
  'awaiting_approval',
  'in_progress',
  'quality_check',
  'ready',
  'on_hold',
  'delivered',
];

export default function JobsAdminPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { services } = useServices();
  const { makes, models } = useVehicleCatalog();
  const pktNow = useMemo(() => getKarachiNowParts(), []);

  const initialStatusParam = searchParams.get('status') as JobStatus | null;
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [statusFilter, setStatusFilter] = useState<
    JobStatus | 'all' | 'active'
  >(
    initialStatusParam && ALL_JOB_STATUSES.includes(initialStatusParam)
      ? initialStatusParam
      : 'all'
  );
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [jobs, setJobs] = useState<JobCardRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [schemaMissing, setSchemaMissing] = useState<boolean>(false);

  // Stage Move Confirmation Modal (used in Board & List quick move)
  const [moveTargetJob, setMoveTargetJob] = useState<JobCardRow | null>(null);
  const [moveTargetStatus, setMoveTargetStatus] =
    useState<JobStatus>('inspection');
  const [moveLogNote, setMoveLogNote] = useState<string>('');
  const [movePublicNote, setMovePublicNote] = useState<string>('');
  const [movingStage, setMovingStage] = useState<boolean>(false);

  // Create Walk-in Job Modal
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custEmail, setCustEmail] = useState<string>('');
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
  const [linkedUserName, setLinkedUserName] = useState<string | null>(null);
  const [lookupDone, setLookupDone] = useState<boolean>(false);
  const [makeId, setMakeId] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [customMake, setCustomMake] = useState<string>('Toyota');
  const [customModel, setCustomModel] = useState<string>('Corolla');
  const [vehYear, setVehYear] = useState<string>('2021');
  const [plateNo, setPlateNo] = useState<string>('');
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [mileageIn, setMileageIn] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [complaint, setComplaint] = useState<string>('');
  const [etaDate, setEtaDate] = useState<string>('');
  const [publicNote, setPublicNote] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [showCost, setShowCost] = useState<boolean>(true);

  const loadJobs = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) {
        if (isMissingDatabaseObjectsError(error)) {
          setSchemaMissing(true);
        } else {
          toast.error(t('admin.jobs.detail.errors.generic'));
        }
        return;
      }

      setSchemaMissing(false);
      setJobs((data ?? []) as unknown as JobCardRow[]);
      notifyAdminJobsUpdated();
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter === 'active') {
        if (job.status === 'delivered' || job.status === 'cancelled') {
          return false;
        }
      } else if (statusFilter !== 'all' && job.status !== statusFilter) {
        return false;
      }

      if (dateFilter === 'today') {
        const recDate = job.received_at ? job.received_at.slice(0, 10) : '';
        if (recDate !== pktNow.dateStr) return false;
      }

      if (q) {
        const hay = [
          job.job_no,
          job.customer_name,
          job.customer_phone,
          job.plate_number,
          job.make_text,
          job.model_text,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [jobs, statusFilter, dateFilter, searchQuery, pktNow.dateStr]);

  const handleOpenMoveModal = (job: JobCardRow, nextSt?: JobStatus) => {
    const allowed = getAllowedJobTransitions(job.status);
    if (allowed.length === 0) return;
    setMoveTargetJob(job);
    setMoveTargetStatus(nextSt && allowed.includes(nextSt) ? nextSt : allowed[0]);
    setMoveLogNote('');
    setMovePublicNote(job.public_note || '');
  };

  const handleConfirmMoveStage = async () => {
    if (!moveTargetJob) return;
    setMovingStage(true);
    try {
      const { error } = await supabase.rpc('admin_update_job_status', {
        p_job_id: moveTargetJob.id,
        p_status: moveTargetStatus,
        p_note: moveLogNote.trim() || null,
        p_public_note: movePublicNote.trim() || null,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('invalid_transition')) {
          toast.error(t('admin.jobs.detail.errors.invalidTransition'));
        } else {
          toast.error(t('admin.jobs.detail.errors.generic'));
        }
        return;
      }

      toast.success(t('admin.jobs.statusUpdatedSuccess'));
      setMoveTargetJob(null);
      await loadJobs();
    } finally {
      setMovingStage(false);
    }
  };

  const handleFindCustomerByPhone = async () => {
    const norm = normalizePakPhoneInput(custPhone);
    if (!PAK_MOBILE_REGEX.test(norm)) {
      toast.error(t('validation.phoneInvalid'));
      return;
    }

    const { data, error } = await supabase.rpc('admin_find_customer', {
      p_phone: norm,
    });
    setLookupDone(true);
    if (error || !data) {
      setLinkedUserId(null);
      setLinkedUserName(null);
      return;
    }

    const res = data as unknown as {
      found: boolean;
      id: string | null;
      full_name: string | null;
    };
    if (res.found && res.id) {
      setLinkedUserId(res.id);
      setLinkedUserName(res.full_name || 'Customer');
      if (!custName.trim() && res.full_name) {
        setCustName(res.full_name);
      }
    } else {
      setLinkedUserId(null);
      setLinkedUserName(null);
    }
  };

  const handleCreateWalkInJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const normPhone = normalizePakPhoneInput(custPhone);
    if (custName.trim().length < 2) {
      toast.error(t('validation.nameMin'));
      return;
    }
    if (!PAK_MOBILE_REGEX.test(normPhone)) {
      toast.error(t('validation.phoneInvalid'));
      return;
    }

    const selectedMakeObj = makes.find((m) => m.id === makeId);
    const selectedModelObj = models.find((m) => m.id === modelId);
    const finalMakeText = selectedMakeObj?.name || customMake.trim();
    const finalModelText = selectedModelObj?.name || customModel.trim();

    if (!finalMakeText || !finalModelText) {
      toast.error(t('booking.errors.makeRequired'));
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('admin_create_job', {
        p_customer_name: custName.trim(),
        p_customer_phone: normPhone,
        p_customer_email: custEmail.trim() || null,
        p_user_id: linkedUserId,
        p_make_id: makeId || null,
        p_model_id: modelId || null,
        p_make_text: finalMakeText,
        p_model_text: finalModelText,
        p_vehicle_year: vehYear ? Number(vehYear) : null,
        p_plate_number: plateNo.trim().toUpperCase() || null,
        p_fuel_type: fuelType,
        p_mileage_in: mileageIn ? Number(mileageIn) : null,
        p_complaint: complaint.trim() || null,
        p_estimated_completion: etaDate || null,
        p_public_note: publicNote.trim() || null,
        p_internal_notes: internalNotes.trim() || null,
        p_show_cost_to_customer: showCost,
        p_service_ids: selectedServiceIds,
      });

      if (error || !data) {
        toast.error(t('admin.jobs.detail.errors.generic'));
        return;
      }

      const res = data as unknown as {
        ok: boolean;
        job_id: string;
        job_no: string;
      };
      toast.success(t('admin.jobs.createdSuccess', { jobNo: res.job_no }));
      notifyAdminJobsUpdated();
      setCreateOpen(false);
      navigate(`/admin/jobs/${res.job_id}`);
    } finally {
      setCreating(false);
    }
  };

  const filteredModelsForMake = models.filter((m) => m.make_id === makeId);

  return (
    <div className="space-y-6 text-start">
      <Seo title={t('admin.jobs.title')} />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.jobs.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('admin.jobs.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* List / Board Switcher */}
          <div className="inline-flex rounded-md bg-[#1B1F26] border border-white/15 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-[#FF6A00] text-white'
                  : 'text-[#8A93A3] hover:text-white'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('admin.jobs.listView')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                viewMode === 'board'
                  ? 'bg-[#FF6A00] text-white'
                  : 'text-[#8A93A3] hover:text-white'
              )}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>{t('admin.jobs.boardView')}</span>
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => void loadJobs()}
          >
            {t('admin.jobs.refreshBtn')}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            {t('admin.jobs.newJobBtn')}
          </Button>
        </div>
      </div>

      {schemaMissing ? (
        <Card className="p-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">
              {t('common.databaseSetupNeededTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F6F8]/85">
              {t('common.databaseSetupNeededDesc')}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Filter Bar */}
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === 'all'
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                )}
              >
                {t('admin.jobs.allStatuses')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === 'active'
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                )}
              >
                {t('admin.jobs.activeOnly')}
              </button>
              {ALL_JOB_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                    statusFilter === st
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                  )}
                >
                  {t(`jobs.statuses.${st}`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    dateFilter === 'all'
                      ? 'bg-[#2A2F38] text-[#FFC21A] border border-[#FFC21A]/40'
                      : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                  )}
                >
                  {t('admin.jobs.allDates')}
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('today')}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    dateFilter === 'today'
                      ? 'bg-[#2A2F38] text-[#FFC21A] border border-[#FFC21A]/40'
                      : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                  )}
                >
                  {t('admin.jobs.today')}
                </button>
              </div>

              <div className="md:col-span-7 relative">
                <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.jobs.searchPlaceholder')}
                  className="w-full rounded-md ps-9 pe-3 py-2 text-xs bg-[#0E1013] text-white placeholder:text-[#8A93A3] border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                />
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title={t('admin.jobs.emptyTitle')}
              description={t('admin.jobs.emptyDesc')}
              action={
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setCreateOpen(true)}
                >
                  {t('admin.jobs.newJobBtn')}
                </Button>
              }
            />
          ) : viewMode === 'list' ? (
            /* LIST VIEW */
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const allowedNext = getAllowedJobTransitions(job.status);
                return (
                  <Card
                    key={job.id}
                    className="p-4 sm:p-5 hover:border-white/25 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Link
                            to={`/admin/jobs/${job.id}`}
                            dir="ltr"
                            className="text-base font-bold font-mono text-[#FFC21A] hover:underline"
                          >
                            {job.job_no}
                          </Link>
                          <Badge variant={getJobStatusBadgeVariant(job.status)}>
                            {t(`jobs.statuses.${job.status}`)}
                          </Badge>
                          {job.is_demo && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                              <FlaskConical className="w-3 h-3" />
                              <span>{t('demo.badge')}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#F5F6F8]">
                          <span className="font-semibold">
                            {job.customer_name}
                          </span>
                          <span dir="ltr" className="text-[#8A93A3] font-mono">
                            {job.customer_phone}
                          </span>
                          <span className="text-[#8A93A3] inline-flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-[#FF6A00]" />
                            {[job.make_text, job.model_text]
                              .filter(Boolean)
                              .join(' ')}{' '}
                            {job.vehicle_year ? `(${job.vehicle_year})` : ''}
                            {job.plate_number ? ` • ${job.plate_number}` : ''}
                          </span>
                        </div>

                        {job.complaint && (
                          <p className="text-xs text-[#8A93A3] line-clamp-1">
                            {job.complaint}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                        <div
                          dir="ltr"
                          className="text-xs text-[#8A93A3] me-2"
                        >
                          {formatKarachiDateTime(job.received_at)}
                        </div>

                        {allowedNext.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMoveModal(job)}
                          >
                            {t('admin.jobs.moveStageBtn')}
                          </Button>
                        )}

                        <Link to={`/admin/jobs/${job.id}`}>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            rightIcon={
                              <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                            }
                          >
                            {t('admin.jobs.openJobBtn')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* BOARD VIEW */
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {BOARD_COLUMNS.map((colStatus) => {
                  const colJobs = filteredJobs.filter(
                    (j) => j.status === colStatus
                  );
                  return (
                    <div
                      key={colStatus}
                      className="rounded-lg bg-[#14171D] border border-white/10 p-3.5 flex flex-col gap-3 min-h-[260px]"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <Badge variant={getJobStatusBadgeVariant(colStatus)}>
                          {t(`jobs.statuses.${colStatus}`)}
                        </Badge>
                        <span
                          dir="ltr"
                          className="text-xs font-bold font-mono text-[#8A93A3]"
                        >
                          {colJobs.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {colJobs.map((job) => {
                          const allowedNext = getAllowedJobTransitions(
                            job.status
                          );
                          return (
                            <div
                              key={job.id}
                              className="rounded-md bg-[#1B1F26] border border-white/10 hover:border-[#FF6A00]/60 p-3 space-y-2 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Link
                                  to={`/admin/jobs/${job.id}`}
                                  dir="ltr"
                                  className="text-xs font-bold font-mono text-[#FFC21A] hover:underline"
                                >
                                  {job.job_no}
                                </Link>
                                {job.plate_number && (
                                  <span
                                    dir="ltr"
                                    className="text-[11px] font-mono text-[#8A93A3]"
                                  >
                                    {job.plate_number}
                                  </span>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-bold text-white">
                                  {[job.make_text, job.model_text]
                                    .filter(Boolean)
                                    .join(' ')}{' '}
                                  {job.vehicle_year
                                    ? `(${job.vehicle_year})`
                                    : ''}
                                </p>
                                <p className="text-[11px] text-[#8A93A3]">
                                  {job.customer_name}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                                {allowedNext.length > 0 ? (
                                  <select
                                    aria-label={t('admin.jobs.moveStageBtn')}
                                    value=""
                                    onChange={(e) => {
                                      const val = e.target.value as JobStatus;
                                      if (val) handleOpenMoveModal(job, val);
                                    }}
                                    className="rounded bg-[#0E1013] border border-white/15 px-2 py-1 text-[11px] text-white cursor-pointer"
                                  >
                                    <option value="">
                                      {t('admin.jobs.moveStageBtn')}…
                                    </option>
                                    {allowedNext.map((st) => (
                                      <option key={st} value={st}>
                                        → {t(`jobs.statuses.${st}`)}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span />
                                )}

                                <Link
                                  to={`/admin/jobs/${job.id}`}
                                  className="text-[11px] font-semibold text-[#FF6A00] hover:underline"
                                >
                                  {t('admin.jobs.openJobBtn')}
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: CONFIRM STAGE MOVE */}
      <Modal
        isOpen={Boolean(moveTargetJob)}
        onClose={() => setMoveTargetJob(null)}
        title={t('admin.jobs.confirmMoveTitle')}
      >
        {moveTargetJob && (
          <div className="space-y-4 text-start">
            <p className="text-sm text-[#F5F6F8]">
              {t('admin.jobs.confirmMoveDesc', {
                jobNo: moveTargetJob.job_no,
                vehicle: [moveTargetJob.make_text, moveTargetJob.model_text]
                  .filter(Boolean)
                  .join(' '),
                from: t(`jobs.statuses.${moveTargetJob.status}`),
                to: t(`jobs.statuses.${moveTargetStatus}`),
              })}
            </p>

            <Select
              label={t('admin.bookings.newStatusLabel')}
              value={moveTargetStatus}
              onChange={(e) => setMoveTargetStatus(e.target.value as JobStatus)}
              options={getAllowedJobTransitions(moveTargetJob.status).map(
                (st) => ({
                  value: st,
                  label: t(`jobs.statuses.${st}`),
                })
              )}
            />

            <Input
              label={t('admin.jobs.internalTransitionNoteLabel')}
              placeholder={t('admin.jobs.internalTransitionNotePlaceholder')}
              value={moveLogNote}
              onChange={(e) => setMoveLogNote(e.target.value)}
            />

            <Textarea
              label={t('admin.jobs.publicNoteUpdateLabel')}
              placeholder={t('admin.jobs.publicNoteUpdatePlaceholder')}
              rows={2}
              value={movePublicNote}
              onChange={(e) => setMovePublicNote(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveTargetJob(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={movingStage}
                onClick={() => void handleConfirmMoveStage()}
              >
                {t('admin.jobs.confirmMoveBtn')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: CREATE WALK-IN JOB CARD */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('admin.jobs.createModal.title')}
        size="lg"
      >
        <form
          onSubmit={handleCreateWalkInJob}
          className="space-y-4 text-start max-h-[75vh] overflow-y-auto pe-1"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t('auth.fullNameLabel')} *`}
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <Input
                label={`${t('auth.phoneLabel')} *`}
                type="tel"
                dir="ltr"
                placeholder="03001234567"
                value={custPhone}
                onChange={(e) => {
                  setCustPhone(e.target.value);
                  setLookupDone(false);
                }}
                required
              />
              <button
                type="button"
                onClick={() => void handleFindCustomerByPhone()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFC21A] hover:underline cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t('admin.jobs.createModal.findCustomerBtn')}</span>
              </button>
            </div>
          </div>

          {lookupDone && (
            <div className="rounded bg-[#0E1013] border border-white/15 px-3 py-2 text-xs flex items-center justify-between">
              {linkedUserId ? (
                <>
                  <span className="text-emerald-300 font-semibold">
                    {t('admin.jobs.createModal.customerFound', {
                      name: linkedUserName,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedUserId(null);
                      setLinkedUserName(null);
                    }}
                    className="text-red-300 hover:underline"
                  >
                    {t('admin.jobs.createModal.unlinkBtn')}
                  </button>
                </>
              ) : (
                <span className="text-[#8A93A3]">
                  {t('admin.jobs.createModal.customerNotFound')}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={t('booking.vehicle.makeLabel')}
              value={makeId}
              onChange={(e) => {
                setMakeId(e.target.value);
                setModelId('');
              }}
              options={[
                { value: '', label: t('booking.vehicle.otherMake') },
                ...makes.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
            {makeId ? (
              <Select
                label={t('booking.vehicle.modelLabel')}
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                options={[
                  { value: '', label: t('booking.vehicle.otherModel') },
                  ...filteredModelsForMake.map((m) => ({
                    value: m.id,
                    label: m.name,
                  })),
                ]}
              />
            ) : (
              <Input
                label={`${t('booking.vehicle.customMakeLabel')} *`}
                value={customMake}
                onChange={(e) => setCustomMake(e.target.value)}
              />
            )}

            {!modelId && (
              <Input
                label={`${t('booking.vehicle.customModelLabel')} *`}
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label={t('booking.vehicle.yearLabel')}
              type="number"
              dir="ltr"
              value={vehYear}
              onChange={(e) => setVehYear(e.target.value)}
            />
            <Input
              label={t('booking.vehicle.plateLabel')}
              dir="ltr"
              placeholder="LEA-21-1234"
              value={plateNo}
              onChange={(e) => setPlateNo(e.target.value.toUpperCase())}
            />
            <Select
              label={t('booking.vehicle.fuelTypeLabel')}
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              options={[
                { value: 'petrol', label: t('booking.fuelTypes.petrol') },
                { value: 'diesel', label: t('booking.fuelTypes.diesel') },
                { value: 'hybrid', label: t('booking.fuelTypes.hybrid') },
                { value: 'cng', label: t('booking.fuelTypes.cng') },
                { value: 'electric', label: t('booking.fuelTypes.electric') },
              ]}
            />
            <Input
              label={t('booking.vehicle.mileageLabel')}
              type="number"
              dir="ltr"
              placeholder="45000"
              value={mileageIn}
              onChange={(e) => setMileageIn(e.target.value)}
            />
          </div>

          {/* Optional Initial Services */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#F5F6F8] block">
              {t('admin.jobs.createModal.initialServicesLabel')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto rounded bg-[#0E1013] border border-white/10 p-3">
              {services.map((srv) => {
                const checked = selectedServiceIds.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    className="flex items-center gap-2 text-xs text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServiceIds((prev) => [...prev, srv.id]);
                        } else {
                          setSelectedServiceIds((prev) =>
                            prev.filter((id) => id !== srv.id)
                          );
                        }
                      }}
                      className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
                    />
                    <span className="truncate">
                      {getLocalized(srv, 'name', i18n.language)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <Textarea
            label={t('admin.jobs.createModal.complaintLabel')}
            placeholder={t('admin.jobs.createModal.complaintPlaceholder')}
            rows={2}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('admin.jobs.createModal.etaLabel')}
              type="date"
              dir="ltr"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
            />
            <Input
              label={t('auth.emailLabel')}
              type="email"
              dir="ltr"
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
            />
          </div>

          <Input
            label={t('admin.jobs.createModal.publicNoteLabel')}
            value={publicNote}
            onChange={(e) => setPublicNote(e.target.value)}
          />

          <Input
            label={t('admin.jobs.createModal.internalNotesLabel')}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />

          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={showCost}
              onChange={(e) => setShowCost(e.target.checked)}
              className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
            />
            <span>{t('admin.jobs.createModal.showCostLabel')}</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={creating}
              leftIcon={<Wrench className="w-4 h-4" />}
            >
              {t('admin.jobs.createModal.submitBtn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
