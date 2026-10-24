import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Ban,
  Calendar,
  CalendarClock,
  Car,
  ClipboardList,
  Clock,
  FlaskConical,
  History,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Trash2,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { PAK_MOBILE_REGEX, normalizePakPhoneInput } from '../../lib/validators';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { getLocalized } from '../../i18n/helpers';
import { useServices } from '../services/useServices';
import {
  DEFAULT_BOOKING_SETTINGS,
  useVehicleCatalog,
} from '../booking/useBookingData';
import {
  addDaysToDateStr,
  formatSlotRange,
  formatTime12h,
  getBookingStatusBadgeVariant,
  getKarachiNowParts,
  normalizeTimeHHMM,
} from '../booking/bookingUtils';
import {
  notifyAdminBookingsUpdated,
  notifyAdminJobsUpdated,
} from './AdminSidebar';
import type {
  BlockedSlotRow,
  BookingRow,
  BookingServiceRow,
  BookingSettingsRow,
  BookingStatus,
  BookingStatusHistoryRow,
  FuelType,
} from '../../types/database';
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

type AdminBookingWithDetails = BookingRow & {
  booking_services?: BookingServiceRow[];
  booking_status_history?: BookingStatusHistoryRow[];
};

const ALL_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'rescheduled',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
];

const STANDARD_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export default function BookingsAdminPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { services } = useServices();
  const { makes, models } = useVehicleCatalog();
  const pktNow = useMemo(() => getKarachiNowParts(), []);

  const [activeTab, setActiveTab] = useState<'bookings' | 'blocked' | 'settings'>(
    'bookings'
  );

  // Bookings List State
  const [bookings, setBookings] = useState<AdminBookingWithDetails[]>([]);
  const [linkedJobsMap, setLinkedJobsMap] = useState<
    Record<string, { id: string; job_no: string }>
  >({});
  const [convertingToJob, setConvertingToJob] = useState<boolean>(false);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [dateFilterMode, setDateFilterMode] = useState<
    'all' | 'today' | 'tomorrow' | 'upcoming7' | 'custom'
  >('all');
  const [customDateFilter, setCustomDateFilter] = useState<string>(pktNow.dateStr);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Booking Detail Modal State
  const [selectedBooking, setSelectedBooking] =
    useState<AdminBookingWithDetails | null>(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<BookingStatus>('confirmed');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Reschedule State inside Detail Modal
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('10:00');
  const [rescheduleNote, setRescheduleNote] = useState<string>('');
  const [rescheduling, setRescheduling] = useState<boolean>(false);

  // Admin Notes State inside Detail Modal
  const [adminNotesDraft, setAdminNotesDraft] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);

  // Create Walk-in / Phone Booking Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [creatingBooking, setCreatingBooking] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerEmail, setNewCustomerEmail] = useState<string>('');
  const [newServiceIds, setNewServiceIds] = useState<string[]>([]);
  const [newMakeText, setNewMakeText] = useState<string>('Toyota');
  const [newModelText, setNewModelText] = useState<string>('Corolla');
  const [newYear, setNewYear] = useState<string>('2022');
  const [newPlate, setNewPlate] = useState<string>('');
  const [newFuel, setNewFuel] = useState<FuelType>('petrol');
  const [newDate, setNewDate] = useState<string>(pktNow.dateStr);
  const [newSlot, setNewSlot] = useState<string>('10:00');
  const [newStatus, setNewStatus] = useState<'confirmed' | 'pending' | 'in_progress'>(
    'confirmed'
  );
  const [newProblem, setNewProblem] = useState<string>('');
  const [newAdminNotes, setNewAdminNotes] = useState<string>('');
  const [newOverrideCapacity, setNewOverrideCapacity] = useState<boolean>(false);

  // Blocked Slots State
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRow[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState<boolean>(false);
  const [blockDate, setBlockDate] = useState<string>(
    addDaysToDateStr(pktNow.dateStr, 1)
  );
  const [blockFullDay, setBlockFullDay] = useState<boolean>(true);
  const [blockStartTime, setBlockStartTime] = useState<string>('13:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('15:00');
  const [blockReason, setBlockReason] = useState<string>('');
  const [savingBlock, setSavingBlock] = useState<boolean>(false);

  // Booking Settings State
  const [bookingSettings, setBookingSettings] = useState<BookingSettingsRow>(
    DEFAULT_BOOKING_SETTINGS
  );
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const loadBookings = useCallback(async () => {
    if (!env.isConfigured) {
      setLoadingBookings(false);
      return;
    }
    setLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, booking_services(*), booking_status_history(*)')
        .order('booking_date', { ascending: false })
        .order('slot_start', { ascending: true });

      if (error) {
        toast.error(t('admin.bookings.loadError'));
        return;
      }

      const list = (data ?? []) as unknown as AdminBookingWithDetails[];
      setBookings(list);

      // Load linked job cards (ignore if Phase 4 SQL has not been run yet)
      const jobsRes = await supabase
        .from('job_cards')
        .select('id, job_no, booking_id')
        .not('booking_id', 'is', null);

      if (!jobsRes.error && jobsRes.data) {
        const nextMap: Record<string, { id: string; job_no: string }> = {};
        for (const row of jobsRes.data as Array<{
          id: string;
          job_no: string;
          booking_id: string | null;
        }>) {
          if (row.booking_id) {
            nextMap[row.booking_id] = { id: row.id, job_no: row.job_no };
          }
        }
        setLinkedJobsMap(nextMap);
      }

      // Update open detail modal if active
      setSelectedBooking((prev) => {
        if (!prev) return null;
        return list.find((item) => item.id === prev.id) ?? prev;
      });

      notifyAdminBookingsUpdated();
    } finally {
      setLoadingBookings(false);
    }
  }, [t]);

  const loadBlockedAndSettings = useCallback(async () => {
    if (!env.isConfigured) return;
    setLoadingBlocked(true);
    try {
      const [blkRes, cfgRes] = await Promise.all([
        supabase
          .from('blocked_slots')
          .select('*')
          .order('block_date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('booking_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle(),
      ]);

      if (!blkRes.error && blkRes.data) {
        setBlockedSlots(blkRes.data as BlockedSlotRow[]);
      }
      if (!cfgRes.error && cfgRes.data) {
        setBookingSettings({
          ...DEFAULT_BOOKING_SETTINGS,
          ...(cfgRes.data as BookingSettingsRow),
        });
      }
    } finally {
      setLoadingBlocked(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
    void loadBlockedAndSettings();
  }, [loadBookings, loadBlockedAndSettings]);

  // Open detail modal & generate signed URL if photo_path exists
  const handleOpenBookingDetail = async (bk: AdminBookingWithDetails) => {
    setSelectedBooking(bk);
    setNextStatus(
      bk.status === 'pending'
        ? 'confirmed'
        : bk.status === 'confirmed'
          ? 'in_progress'
          : bk.status === 'in_progress'
            ? 'completed'
            : bk.status
    );
    setStatusNote('');
    setRescheduleDate(bk.booking_date);
    setRescheduleSlot(normalizeTimeHHMM(bk.slot_start) || '10:00');
    setRescheduleNote('');
    setAdminNotesDraft(bk.admin_notes || '');
    setSignedPhotoUrl(null);

    if (bk.photo_path) {
      const { data } = await supabase.storage
        .from('booking-uploads')
        .createSignedUrl(bk.photo_path, 600);
      if (data?.signedUrl) {
        setSignedPhotoUrl(data.signedUrl);
      }
    }
  };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tomorrowStr = addDaysToDateStr(pktNow.dateStr, 1);
    const next7Str = addDaysToDateStr(pktNow.dateStr, 7);

    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      if (dateFilterMode === 'today' && b.booking_date !== pktNow.dateStr) {
        return false;
      }
      if (dateFilterMode === 'tomorrow' && b.booking_date !== tomorrowStr) {
        return false;
      }
      if (
        dateFilterMode === 'upcoming7' &&
        (b.booking_date < pktNow.dateStr || b.booking_date > next7Str)
      ) {
        return false;
      }
      if (dateFilterMode === 'custom' && customDateFilter && b.booking_date !== customDateFilter) {
        return false;
      }

      if (q) {
        const hay = [
          b.booking_no,
          b.customer_name,
          b.customer_phone,
          b.plate_number,
          b.make_text,
          b.model_text,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    bookings,
    statusFilter,
    dateFilterMode,
    customDateFilter,
    searchQuery,
    pktNow.dateStr,
  ]);

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase.rpc('admin_update_booking_status', {
        p_booking_id: selectedBooking.id,
        p_status: nextStatus,
        p_note: statusNote.trim() || null,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('invalid_transition')) {
          toast.error(t('admin.bookings.errors.invalidTransition'));
        } else {
          toast.error(t('admin.bookings.errors.statusUpdateFailed'));
        }
        return;
      }

      toast.success(t('admin.bookings.statusUpdatedSuccess'));
      setStatusNote('');
      await loadBookings();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleSlot) return;
    setRescheduling(true);
    try {
      const { error } = await supabase.rpc('admin_reschedule_booking', {
        p_booking_id: selectedBooking.id,
        p_date: rescheduleDate,
        p_slot_start: normalizeTimeHHMM(rescheduleSlot),
        p_note: rescheduleNote.trim() || null,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('slot_unavailable')) {
          toast.error(t('booking.errors.slotUnavailable'));
        } else {
          toast.error(t('admin.bookings.errors.rescheduleFailed'));
        }
        return;
      }

      toast.success(t('admin.bookings.rescheduledSuccess'));
      setRescheduleNote('');
      await loadBookings();
    } finally {
      setRescheduling(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedBooking) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ admin_notes: adminNotesDraft.trim() || null })
        .eq('id', selectedBooking.id);

      if (error) {
        toast.error(t('admin.bookings.errors.notesSaveFailed'));
        return;
      }

      toast.success(t('admin.bookings.notesSavedSuccess'));
      await loadBookings();
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConvertBookingToJob = async (bookingId: string) => {
    const existing = linkedJobsMap[bookingId];
    if (existing) {
      setSelectedBooking(null);
      navigate(`/admin/jobs/${existing.id}`);
      return;
    }

    setConvertingToJob(true);
    try {
      const { data, error } = await supabase.rpc(
        'admin_create_job_from_booking',
        {
          p_booking_id: bookingId,
        }
      );

      if (error) {
        const msg = error.message || '';
        if (msg.includes('job_already_exists')) {
          toast.error(t('admin.bookings.errors.jobAlreadyExists'));
          await loadBookings();
        } else {
          toast.error(t('admin.bookings.errors.convertFailed'));
        }
        return;
      }

      const res = data as unknown as {
        ok: boolean;
        job_id: string;
        job_no: string;
      };
      toast.success(
        t('admin.bookings.convertedToJobSuccess', { jobNo: res.job_no })
      );
      notifyAdminBookingsUpdated();
      notifyAdminJobsUpdated();
      setSelectedBooking(null);
      navigate(`/admin/jobs/${res.job_id}`);
    } finally {
      setConvertingToJob(false);
    }
  };

  const handleCreateAdminBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const normPhone = normalizePakPhoneInput(newCustomerPhone);
    if (newCustomerName.trim().length < 2) {
      toast.error(t('validation.nameMin'));
      return;
    }
    if (!PAK_MOBILE_REGEX.test(normPhone)) {
      toast.error(t('validation.phoneInvalid'));
      return;
    }
    if (newServiceIds.length < 1) {
      toast.error(t('booking.errors.selectAtLeastOneService'));
      return;
    }
    if (!newDate || !newSlot) {
      toast.error(t('booking.errors.slotRequired'));
      return;
    }

    setCreatingBooking(true);
    try {
      const { error } = await supabase.rpc('admin_create_booking', {
        p_customer_name: newCustomerName.trim(),
        p_customer_phone: normPhone,
        p_customer_email: newCustomerEmail.trim() || null,
        p_service_ids: newServiceIds,
        p_make_id: null,
        p_model_id: null,
        p_make_text: newMakeText.trim() || 'Vehicle',
        p_model_text: newModelText.trim() || 'Model',
        p_vehicle_year: Number(newYear) || 2022,
        p_plate_number: newPlate.trim().toUpperCase() || null,
        p_fuel_type: newFuel,
        p_mileage_km: null,
        p_booking_date: newDate,
        p_slot_start: normalizeTimeHHMM(newSlot),
        p_problem_description: newProblem.trim() || null,
        p_pickup_requested: false,
        p_pickup_address: null,
        p_admin_notes: newAdminNotes.trim() || null,
        p_status: newStatus,
        p_override_capacity: newOverrideCapacity,
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('slot_unavailable')) {
          toast.error(t('booking.errors.slotUnavailable'));
        } else {
          toast.error(t('admin.bookings.errors.createFailed'));
        }
        return;
      }

      toast.success(t('admin.bookings.createdSuccess'));
      setCreateModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewServiceIds([]);
      setNewProblem('');
      setNewAdminNotes('');
      await loadBookings();
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    if (!blockFullDay && blockEndTime <= blockStartTime) {
      toast.error(t('admin.bookings.blocked.invalidRange'));
      return;
    }

    setSavingBlock(true);
    try {
      const { error } = await supabase.from('blocked_slots').insert({
        block_date: blockDate,
        start_time: blockFullDay ? null : blockStartTime,
        end_time: blockFullDay ? null : blockEndTime,
        reason: blockReason.trim() || null,
      });

      if (error) {
        toast.error(t('admin.bookings.blocked.saveError'));
        return;
      }

      toast.success(t('admin.bookings.blocked.savedSuccess'));
      setBlockReason('');
      await loadBlockedAndSettings();
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlockedSlot = async (id: string) => {
    const { error } = await supabase.from('blocked_slots').delete().eq('id', id);
    if (error) {
      toast.error(t('admin.bookings.blocked.deleteError'));
      return;
    }
    toast.success(t('admin.bookings.blocked.deletedSuccess'));
    await loadBlockedAndSettings();
  };

  const handleSaveBookingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('booking_settings')
        .update({
          online_booking_enabled: bookingSettings.online_booking_enabled,
          slot_minutes: bookingSettings.slot_minutes,
          max_bookings_per_slot: Math.max(1, Number(bookingSettings.max_bookings_per_slot)),
          min_advance_hours: Math.max(0, Number(bookingSettings.min_advance_hours)),
          max_advance_days: Math.min(90, Math.max(1, Number(bookingSettings.max_advance_days))),
          allow_pickup_drop: bookingSettings.allow_pickup_drop,
        })
        .eq('id', 1);

      if (error) {
        toast.error(t('admin.bookings.settings.saveError'));
        return;
      }

      toast.success(t('admin.bookings.settings.savedSuccess'));
      await loadBlockedAndSettings();
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <Seo title={t('admin.bookings.title')} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.bookings.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">
            {t('admin.bookings.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadBookings()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            {t('admin.bookings.refreshBtn')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('admin.bookings.newBookingBtn')}
          </Button>
        </div>
      </div>

      {/* Top Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
            activeTab === 'bookings'
              ? 'bg-[#FF6A00] text-white'
              : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
          )}
        >
          <CalendarClock className="w-4 h-4" />
          <span>{t('admin.bookings.tabs.allBookings')}</span>
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px]">
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('blocked')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
            activeTab === 'blocked'
              ? 'bg-[#FF6A00] text-white'
              : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
          )}
        >
          <Ban className="w-4 h-4" />
          <span>{t('admin.bookings.tabs.blockedSlots')}</span>
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px]">
            {blockedSlots.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
            activeTab === 'settings'
              ? 'bg-[#FF6A00] text-white'
              : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
          )}
        >
          <Settings2 className="w-4 h-4" />
          <span>{t('admin.bookings.tabs.bookingSettings')}</span>
        </button>
      </div>

      {/* TAB 1: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-5">
          {/* Filters Toolbar */}
          <Card className="p-4 sm:p-5 space-y-4">
            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === 'all'
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                )}
              >
                {t('admin.bookings.filters.allStatuses')}
              </button>
              {ALL_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    statusFilter === st
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                  )}
                >
                  {t(`booking.statuses.${st}`)}
                </button>
              ))}
            </div>

            {/* Date Filter & Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6 flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: t('admin.bookings.filters.allDates') },
                    { id: 'today', label: t('admin.bookings.filters.today') },
                    { id: 'tomorrow', label: t('admin.bookings.filters.tomorrow') },
                    { id: 'upcoming7', label: t('admin.bookings.filters.upcoming7') },
                    { id: 'custom', label: t('admin.bookings.filters.customDate') },
                  ] as const
                ).map((df) => (
                  <button
                    key={df.id}
                    type="button"
                    onClick={() => setDateFilterMode(df.id)}
                    className={cn(
                      'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                      dateFilterMode === df.id
                        ? 'bg-[#2A2F38] text-[#FFC21A] border border-[#FFC21A]/40'
                        : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                    )}
                  >
                    {df.label}
                  </button>
                ))}

                {dateFilterMode === 'custom' && (
                  <input
                    type="date"
                    dir="ltr"
                    value={customDateFilter}
                    onChange={(e) => setCustomDateFilter(e.target.value)}
                    className="rounded bg-[#0E1013] border border-white/15 px-2.5 py-1 text-xs text-white"
                  />
                )}
              </div>

              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.bookings.filters.searchPlaceholder')}
                  className="w-full rounded-md ps-9 pe-3 py-2 text-xs bg-[#0E1013] text-white placeholder:text-[#8A93A3] border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                />
              </div>
            </div>
          </Card>

          {/* Bookings Table / Cards */}
          {loadingBookings ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              title={t('admin.bookings.emptyTitle')}
              description={t('admin.bookings.emptyDescription')}
            />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((bk) => {
                const srvNames = (bk.booking_services ?? []).map(
                  (s) => s.service_name
                );
                return (
                  <Card
                    key={bk.id}
                    className="p-4 sm:p-5 hover:border-white/25 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            dir="ltr"
                            className="text-base font-bold font-mono text-[#FFC21A]"
                          >
                            {bk.booking_no}
                          </span>
                          <Badge variant={getBookingStatusBadgeVariant(bk.status)}>
                            {t(`booking.statuses.${bk.status}`)}
                          </Badge>
                          {bk.is_demo && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                              <FlaskConical className="w-3 h-3" />
                              <span>{t('demo.badge')}</span>
                            </span>
                          )}
                          {bk.pickup_requested && (
                            <Badge variant="info">
                              {t('booking.summary.pickupRequested')}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#F5F6F8]">
                          <span className="font-semibold">{bk.customer_name}</span>
                          <span dir="ltr" className="text-[#8A93A3] font-mono">
                            {bk.customer_phone}
                          </span>
                          <span className="text-[#8A93A3]">
                            {[bk.make_text, bk.model_text]
                              .filter(Boolean)
                              .join(' ')}{' '}
                            {bk.vehicle_year ? `(${bk.vehicle_year})` : ''}
                            {bk.plate_number ? ` • ${bk.plate_number}` : ''}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {srvNames.map((sn, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-[#0E1013] border border-white/10 px-2 py-0.5 text-[11px] text-[#8A93A3]"
                            >
                              {sn}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                        <div dir="ltr" className="text-start lg:text-end">
                          <p className="text-xs sm:text-sm font-bold text-white">
                            {bk.booking_date}
                          </p>
                          <p className="text-xs text-[#FF6A00] font-semibold">
                            {formatSlotRange(bk.slot_start, bk.slot_end)}
                          </p>
                        </div>

                        {linkedJobsMap[bk.id] && (
                          <Link to={`/admin/jobs/${linkedJobsMap[bk.id].id}`}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              leftIcon={
                                <ClipboardList className="w-3.5 h-3.5 text-[#FFC21A]" />
                              }
                            >
                              <span dir="ltr" className="font-mono">
                                {linkedJobsMap[bk.id].job_no}
                              </span>
                            </Button>
                          </Link>
                        )}

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleOpenBookingDetail(bk)}
                        >
                          {t('admin.bookings.manageBtn')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BLOCKED DATES & HOURS */}
      {activeTab === 'blocked' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add Blocked Slot Form */}
          <Card className="lg:col-span-5 p-6 space-y-4">
            <h2 className="text-lg font-bold font-heading text-white">
              {t('admin.bookings.blocked.addTitle')}
            </h2>
            <p className="text-xs text-[#8A93A3]">
              {t('admin.bookings.blocked.addSubtitle')}
            </p>

            <form onSubmit={handleAddBlockedSlot} className="space-y-4">
              <Input
                label={`${t('admin.bookings.blocked.dateLabel')} *`}
                type="date"
                dir="ltr"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
              />

              <label className="flex items-center gap-2.5 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockFullDay}
                  onChange={(e) => setBlockFullDay(e.target.checked)}
                  className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
                />
                <span>{t('admin.bookings.blocked.fullDayLabel')}</span>
              </label>

              {!blockFullDay && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('admin.bookings.blocked.startTimeLabel')}
                    type="time"
                    dir="ltr"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                  />
                  <Input
                    label={t('admin.bookings.blocked.endTimeLabel')}
                    type="time"
                    dir="ltr"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                  />
                </div>
              )}

              <Input
                label={t('admin.bookings.blocked.reasonLabel')}
                placeholder={t('admin.bookings.blocked.reasonPlaceholder')}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={savingBlock}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('admin.bookings.blocked.addBtn')}
              </Button>
            </form>
          </Card>

          {/* Existing Blocked Slots List */}
          <Card className="lg:col-span-7 p-6 space-y-4">
            <h2 className="text-lg font-bold font-heading text-white">
              {t('admin.bookings.blocked.listTitle')}
            </h2>

            {loadingBlocked ? (
              <Skeleton className="h-32 w-full" />
            ) : blockedSlots.length === 0 ? (
              <p className="text-sm text-[#8A93A3] py-6 text-center">
                {t('admin.bookings.blocked.emptyText')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {blockedSlots.map((bs) => (
                  <div
                    key={bs.id}
                    className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          dir="ltr"
                          className="text-sm font-bold font-mono text-white"
                        >
                          {bs.block_date}
                        </span>
                        <Badge variant={bs.start_time ? 'warning' : 'danger'}>
                          {bs.start_time
                            ? formatSlotRange(bs.start_time, bs.end_time)
                            : t('admin.bookings.blocked.fullDayBadge')}
                        </Badge>
                      </div>
                      {bs.reason && (
                        <p className="text-xs text-[#8A93A3] mt-1">{bs.reason}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDeleteBlockedSlot(bs.id)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: BOOKING SETTINGS & CAPACITY */}
      {activeTab === 'settings' && (
        <Card className="p-6 sm:p-8 max-w-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold font-heading text-white">
              {t('admin.bookings.settings.title')}
            </h2>
            <p className="text-xs text-[#8A93A3] mt-1">
              {t('admin.bookings.settings.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSaveBookingSettings} className="space-y-5">
            <label className="flex items-start gap-3 p-4 rounded-lg bg-[#0E1013] border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={bookingSettings.online_booking_enabled}
                onChange={(e) =>
                  setBookingSettings((prev) => ({
                    ...prev,
                    online_booking_enabled: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
              />
              <div>
                <span className="text-sm font-bold text-white block">
                  {t('admin.bookings.settings.enableOnlineBooking')}
                </span>
                <span className="text-xs text-[#8A93A3]">
                  {t('admin.bookings.settings.enableOnlineBookingHint')}
                </span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('admin.bookings.settings.slotDurationLabel')}
                value={String(bookingSettings.slot_minutes)}
                onChange={(e) =>
                  setBookingSettings((prev) => ({
                    ...prev,
                    slot_minutes: Number(e.target.value) as BookingSettingsRow['slot_minutes'],
                  }))
                }
                options={[
                  { value: '30', label: '30 minutes' },
                  { value: '45', label: '45 minutes' },
                  { value: '60', label: '60 minutes (1 hour)' },
                  { value: '90', label: '90 minutes' },
                  { value: '120', label: '120 minutes (2 hours)' },
                ]}
              />

              <Input
                label={t('admin.bookings.settings.maxBookingsPerSlotLabel')}
                type="number"
                dir="ltr"
                min={1}
                max={25}
                value={String(bookingSettings.max_bookings_per_slot)}
                onChange={(e) =>
                  setBookingSettings((prev) => ({
                    ...prev,
                    max_bookings_per_slot: Number(e.target.value),
                  }))
                }
              />

              <Input
                label={t('admin.bookings.settings.minAdvanceHoursLabel')}
                type="number"
                dir="ltr"
                min={0}
                max={168}
                value={String(bookingSettings.min_advance_hours)}
                onChange={(e) =>
                  setBookingSettings((prev) => ({
                    ...prev,
                    min_advance_hours: Number(e.target.value),
                  }))
                }
              />

              <Input
                label={t('admin.bookings.settings.maxAdvanceDaysLabel')}
                type="number"
                dir="ltr"
                min={1}
                max={90}
                value={String(bookingSettings.max_advance_days)}
                onChange={(e) =>
                  setBookingSettings((prev) => ({
                    ...prev,
                    max_advance_days: Number(e.target.value),
                  }))
                }
              />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-lg bg-[#0E1013] border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={bookingSettings.allow_pickup_drop}
                onChange={(e) =>
                  setBookingSettings((prev) => ({
                    ...prev,
                    allow_pickup_drop: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
              />
              <div>
                <span className="text-sm font-bold text-white block">
                  {t('admin.bookings.settings.allowPickupDrop')}
                </span>
                <span className="text-xs text-[#8A93A3]">
                  {t('admin.bookings.settings.allowPickupDropHint')}
                </span>
              </div>
            </label>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={savingSettings}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* MODAL 1: BOOKING DETAIL, STATUS UPDATE & RESCHEDULE */}
      <Modal
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={
          selectedBooking
            ? `${selectedBooking.booking_no} — ${selectedBooking.customer_name}`
            : ''
        }
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6 text-start max-h-[75vh] overflow-y-auto pe-1">
            {/* Top Status & Quick Contact Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant={getBookingStatusBadgeVariant(selectedBooking.status)}
                >
                  {t(`booking.statuses.${selectedBooking.status}`)}
                </Badge>
                {selectedBooking.is_demo && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    {t('demo.badge')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a href={`tel:${selectedBooking.customer_phone}`}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<Phone className="w-3.5 h-3.5 text-[#FF6A00]" />}
                  >
                    {t('nav.callNow')}
                  </Button>
                </a>

                <a
                  href={buildWhatsAppUrl(
                    selectedBooking.customer_phone,
                    t('admin.bookings.whatsappCustomerPrefill', {
                      name: selectedBooking.customer_name,
                      bookingNo: selectedBooking.booking_no,
                      date: selectedBooking.booking_date,
                      slot: formatSlotRange(
                        selectedBooking.slot_start,
                        selectedBooking.slot_end
                      ),
                      status: t(`booking.statuses.${selectedBooking.status}`),
                    })
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<MessageCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 space-y-1">
                <span className="text-xs text-[#8A93A3] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>{t('booking.summary.dateAndSlot')}</span>
                </span>
                <p dir="ltr" className="font-bold text-white">
                  {selectedBooking.booking_date}
                </p>
                <p dir="ltr" className="text-xs text-[#FFC21A]">
                  {formatSlotRange(
                    selectedBooking.slot_start,
                    selectedBooking.slot_end
                  )}{' '}
                  (PKT)
                </p>
              </div>

              <div className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 space-y-1">
                <span className="text-xs text-[#8A93A3] flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>{t('booking.summary.vehicle')}</span>
                </span>
                <p className="font-bold text-white">
                  {[selectedBooking.make_text, selectedBooking.model_text]
                    .filter(Boolean)
                    .join(' ')}{' '}
                  {selectedBooking.vehicle_year
                    ? `(${selectedBooking.vehicle_year})`
                    : ''}
                </p>
                <p className="text-xs text-[#8A93A3]">
                  {selectedBooking.plate_number || '—'} •{' '}
                  {selectedBooking.fuel_type || '—'}
                  {selectedBooking.mileage_km
                    ? ` • ${selectedBooking.mileage_km.toLocaleString()} km`
                    : ''}
                </p>
              </div>
            </div>

            {/* Services & Problem Description */}
            <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
              <div>
                <span className="text-xs text-[#8A93A3] block mb-1.5">
                  {t('booking.summary.selectedServices')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedBooking.booking_services ?? []).map((s) => (
                    <span
                      key={s.id}
                      className="rounded bg-[#1B1F26] border border-white/15 px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      {s.service_name}
                    </span>
                  ))}
                </div>
              </div>

              {selectedBooking.problem_description && (
                <div>
                  <span className="text-xs text-[#8A93A3] block">
                    {t('booking.vehicle.problemLabel')}
                  </span>
                  <p className="text-xs sm:text-sm text-[#F5F6F8] mt-1 whitespace-pre-line">
                    {selectedBooking.problem_description}
                  </p>
                </div>
              )}

              {selectedBooking.pickup_requested && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{t('booking.summary.pickupRequested')}</span>
                  </span>
                  <p className="text-xs text-white mt-0.5">
                    {selectedBooking.pickup_address}
                  </p>
                </div>
              )}

              {/* Signed URL Photo Viewer */}
              {selectedBooking.photo_path && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-xs text-[#8A93A3] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>{t('booking.vehicle.photoLabel')}</span>
                  </span>
                  {signedPhotoUrl ? (
                    <a
                      href={signedPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={signedPhotoUrl}
                        alt="Customer booking upload"
                        className="max-h-48 rounded border border-white/15 object-cover"
                      />
                    </a>
                  ) : (
                    <p className="text-xs text-[#8A93A3]">
                      {t('common.loading')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action 0: Convert Booking to Workshop Job Card (Phase 4) */}
            {(!['cancelled', 'rejected'].includes(selectedBooking.status) ||
              Boolean(linkedJobsMap[selectedBooking.id])) && (
              <div className="rounded-md bg-[#0E1013] border border-[#FF6A00]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#FF6A00]" />
                    <span>{t('admin.bookings.convertToJobTitle')}</span>
                  </h3>
                  <p className="text-xs text-[#8A93A3]">
                    {linkedJobsMap[selectedBooking.id]
                      ? t('admin.bookings.alreadyHasJobNote', {
                          jobNo: linkedJobsMap[selectedBooking.id].job_no,
                        })
                      : t('admin.bookings.convertToJobDesc')}
                  </p>
                </div>

                {linkedJobsMap[selectedBooking.id] ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={
                      <ClipboardList className="w-4 h-4 text-[#FFC21A]" />
                    }
                    onClick={() => {
                      const targetId = linkedJobsMap[selectedBooking.id].id;
                      setSelectedBooking(null);
                      navigate(`/admin/jobs/${targetId}`);
                    }}
                  >
                    {t('admin.bookings.viewJobCardBtn', {
                      jobNo: linkedJobsMap[selectedBooking.id].job_no,
                    })}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={convertingToJob}
                    leftIcon={<Wrench className="w-4 h-4" />}
                    onClick={() =>
                      void handleConvertBookingToJob(selectedBooking.id)
                    }
                  >
                    {convertingToJob
                      ? t('admin.bookings.convertingToJob')
                      : t('admin.bookings.convertToJobBtn')}
                  </Button>
                )}
              </div>
            )}

            {/* Action 1: Update Status */}
            <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">
                {t('admin.bookings.updateStatusTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <Select
                    label={t('admin.bookings.newStatusLabel')}
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(e.target.value as BookingStatus)
                    }
                    options={ALL_STATUSES.map((st) => ({
                      value: st,
                      label: t(`booking.statuses.${st}`),
                    }))}
                  />
                </div>
                <div className="sm:col-span-5">
                  <Input
                    label={t('admin.bookings.statusNoteLabel')}
                    placeholder={t('admin.bookings.statusNotePlaceholder')}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    isLoading={updatingStatus}
                    onClick={() => void handleUpdateStatus()}
                  >
                    {t('admin.bookings.applyStatusBtn')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Action 2: Reschedule Booking */}
            {!['completed', 'cancelled', 'rejected'].includes(
              selectedBooking.status
            ) && (
              <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  {t('admin.bookings.rescheduleTitle')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <Input
                      label={t('admin.bookings.blocked.dateLabel')}
                      type="date"
                      dir="ltr"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Select
                      label={t('admin.bookings.slotLabel')}
                      value={rescheduleSlot}
                      onChange={(e) => setRescheduleSlot(e.target.value)}
                      options={STANDARD_SLOTS.map((sl) => ({
                        value: sl,
                        label: formatTime12h(sl),
                      }))}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      isLoading={rescheduling}
                      onClick={() => void handleReschedule()}
                    >
                      {t('admin.bookings.rescheduleBtn')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action 3: Admin Internal Notes */}
            <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
              <Textarea
                label={t('admin.bookings.adminNotesLabel')}
                rows={2}
                value={adminNotesDraft}
                onChange={(e) => setAdminNotesDraft(e.target.value)}
                placeholder={t('admin.bookings.adminNotesPlaceholder')}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={savingNotes}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  onClick={() => void handleSaveAdminNotes()}
                >
                  {t('admin.bookings.saveNotesBtn')}
                </Button>
              </div>
            </div>

            {/* Status History Timeline */}
            {(selectedBooking.booking_status_history ?? []).length > 0 && (
              <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#8A93A3] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>{t('booking.lookup.historyTitle')}</span>
                </h3>
                <ol className="space-y-2.5 ps-2 border-s border-white/15">
                  {(selectedBooking.booking_status_history ?? []).map((h) => (
                    <li key={h.id} className="ps-3 relative text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#FF6A00] absolute -start-[4.5px] top-1.5" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">
                          {t(`booking.statuses.${h.to_status}`)}
                        </span>
                        <span dir="ltr" className="text-[#8A93A3] tabular-nums">
                          {new Date(h.created_at).toLocaleString('en-PK', {
                            timeZone: 'Asia/Karachi',
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      {h.note && <p className="text-[#8A93A3] mt-0.5">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 2: CREATE WALK-IN / PHONE BOOKING */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('admin.bookings.newBookingBtn')}
        size="lg"
      >
        <form
          onSubmit={handleCreateAdminBooking}
          className="space-y-4 text-start max-h-[75vh] overflow-y-auto pe-1"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`${t('contact.form.nameLabel')} *`}
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Muhammad Ali"
            />
            <Input
              label={`${t('contact.form.phoneLabel')} *`}
              dir="ltr"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="03001234567"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={`${t('booking.vehicle.makeLabel')} *`}
              value={newMakeText}
              onChange={(e) => setNewMakeText(e.target.value)}
              placeholder="Toyota"
            />
            <Input
              label={`${t('booking.vehicle.modelLabel')} *`}
              value={newModelText}
              onChange={(e) => setNewModelText(e.target.value)}
              placeholder="Corolla"
            />
            <Input
              label={`${t('booking.vehicle.yearLabel')} *`}
              type="number"
              dir="ltr"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={t('booking.vehicle.plateLabel')}
              dir="ltr"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="LEA-22-100"
            />
            <Input
              label={`${t('admin.bookings.blocked.dateLabel')} *`}
              type="date"
              dir="ltr"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Select
              label={`${t('admin.bookings.slotLabel')} *`}
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              options={STANDARD_SLOTS.map((sl) => ({
                value: sl,
                label: formatTime12h(sl),
              }))}
            />
          </div>

          {/* Select Services */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#F5F6F8]">
              {t('booking.summary.selectedServices')} *
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-md bg-[#0E1013] border border-white/10">
              {services.map((srv) => {
                const selected = newServiceIds.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() =>
                      setNewServiceIds((prev) =>
                        prev.includes(srv.id)
                          ? prev.filter((id) => id !== srv.id)
                          : prev.length < 5
                            ? [...prev, srv.id]
                            : prev
                      )
                    }
                    className={cn(
                      'rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                      selected
                        ? 'bg-[#FF6A00] text-white'
                        : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white'
                    )}
                  >
                    {getLocalized(srv, 'name', i18n.language)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t('admin.bookings.initialStatusLabel')}
              value={newStatus}
              onChange={(e) =>
                setNewStatus(
                  e.target.value as 'confirmed' | 'pending' | 'in_progress'
                )
              }
              options={[
                { value: 'confirmed', label: t('booking.statuses.confirmed') },
                { value: 'pending', label: t('booking.statuses.pending') },
                { value: 'in_progress', label: t('booking.statuses.in_progress') },
              ]}
            />

            <div className="pt-7">
              <label className="flex items-center gap-2 text-xs text-[#F5F6F8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newOverrideCapacity}
                  onChange={(e) => setNewOverrideCapacity(e.target.checked)}
                  className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
                />
                <span>{t('admin.bookings.overrideCapacityLabel')}</span>
              </label>
            </div>
          </div>

          <Textarea
            label={t('booking.vehicle.problemLabel')}
            rows={2}
            value={newProblem}
            onChange={(e) => setNewProblem(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={creatingBooking}
            >
              {t('admin.bookings.newBookingBtn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
