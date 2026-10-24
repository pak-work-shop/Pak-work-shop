import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Car,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  ExternalLink,
  LogOut,
  MapPin,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  User as UserIcon,
  Wrench,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useAuth } from '../auth/useAuth';
import {
  createAccountProfileSchema,
  createAddressFormSchema,
  createVehicleFormSchema,
  type AccountProfileFormValues,
  type AddressFormValues,
  type VehicleFormValues,
} from '../../lib/validators';
import {
  canCustomerCancelBooking,
  formatSlotRange,
  getBookingStatusBadgeVariant,
} from '../booking/bookingUtils';
import { useVehicleCatalog } from '../booking/useBookingData';
import { useVehicleFilter } from '../catalogue/VehicleFilterContext';
import {
  formatKarachiDateTime,
  formatPKR,
  getInvoiceStatusBadgeVariant,
  getJobStatusBadgeVariant,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import {
  canCustomerCancelOrder,
  getOrderPaymentStatusBadgeVariant,
  getOrderStatusBadgeVariant,
} from '../orders/orderUtils';
import { useCart } from '../cart/CartContext';
import { pickLocalized } from '../../lib/format';
import type { LanguageCode } from '../../types/i18n';
import type {
  AddressRow,
  BookingRow,
  BookingServiceRow,
  BookingStatusHistoryRow,
  CustomerJobDetailResponse,
  JobCardRow,
  OrderItemRow,
  OrderRow,
  OrderStatusHistoryRow,
  VehicleRow,
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
  Spinner,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { cn } from '../../lib/utils';

type CustomerBookingWithDetails = BookingRow & {
  booking_services?: BookingServiceRow[];
  booking_status_history?: BookingStatusHistoryRow[];
};

type CustomerOrderWithDetails = OrderRow & {
  order_items?: OrderItemRow[];
  order_status_history?: OrderStatusHistoryRow[];
};

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as LanguageCode;
  const { user, profile, isAdmin, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { makes, models } = useVehicleCatalog();
  const { setSelectedVehicle } = useVehicleFilter();
  const { addItem, openDrawer } = useCart();

  const [activeTab, setActiveTab] = useState<
    'bookings' | 'jobs' | 'orders' | 'vehicles' | 'addresses' | 'profile'
  >('bookings');

  // Bookings state
  const [bookings, setBookings] = useState<CustomerBookingWithDetails[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelBooking, setConfirmCancelBooking] =
    useState<CustomerBookingWithDetails | null>(null);

  // Jobs state (Phase 4)
  const [jobs, setJobs] = useState<Omit<JobCardRow, 'internal_notes'>[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(true);
  const [jobsSchemaMissing, setJobsSchemaMissing] = useState<boolean>(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobDetailsMap, setJobDetailsMap] = useState<
    Record<string, CustomerJobDetailResponse>
  >({});
  const [loadingJobDetailId, setLoadingJobDetailId] = useState<string | null>(
    null
  );

  // Orders state (Phase 6)
  const [orders, setOrders] = useState<CustomerOrderWithDetails[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersSchemaMissing, setOrdersSchemaMissing] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [confirmCancelOrder, setConfirmCancelOrder] =
    useState<CustomerOrderWithDetails | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(true);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [addressesLoading, setAddressesLoading] = useState<boolean>(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const loadAccountData = useCallback(async () => {
    if (!user || !env.isConfigured) {
      setBookingsLoading(false);
      setJobsLoading(false);
      setOrdersLoading(false);
      setVehiclesLoading(false);
      setAddressesLoading(false);
      return;
    }

    setBookingsLoading(true);
    setJobsLoading(true);
    setOrdersLoading(true);
    setVehiclesLoading(true);
    setAddressesLoading(true);

    try {
      const [bRes, jRes, oRes, vRes, aRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, booking_services(*), booking_status_history(*)')
          .eq('user_id', user.id)
          .order('booking_date', { ascending: false })
          .order('slot_start', { ascending: false }),
        supabase
          .from('job_cards')
          .select(
            'id, job_no, booking_id, user_id, customer_name, customer_phone, customer_email, make_id, model_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in, status, complaint, estimated_completion, public_note, show_cost_to_customer, received_at, delivered_at, is_demo, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('received_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*, order_items(*), order_status_history(*)')
          .eq('user_id', user.id)
          .order('placed_at', { ascending: false }),
        supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);

      if (!bRes.error && bRes.data) {
        setBookings(bRes.data as unknown as CustomerBookingWithDetails[]);
      }
      if (jRes.error) {
        if (isMissingDatabaseObjectsError(jRes.error)) {
          setJobsSchemaMissing(true);
        }
      } else if (jRes.data) {
        setJobsSchemaMissing(false);
        setJobs(jRes.data as unknown as Omit<JobCardRow, 'internal_notes'>[]);
      }
      if (oRes.error) {
        if (isMissingDatabaseObjectsError(oRes.error)) {
          setOrdersSchemaMissing(true);
        }
      } else if (oRes.data) {
        setOrdersSchemaMissing(false);
        setOrders(oRes.data as unknown as CustomerOrderWithDetails[]);
      }
      if (!vRes.error && vRes.data) {
        setVehicles(vRes.data as VehicleRow[]);
      }
      if (!aRes.error && aRes.data) {
        setAddresses(aRes.data as AddressRow[]);
      }
    } finally {
      setBookingsLoading(false);
      setJobsLoading(false);
      setOrdersLoading(false);
      setVehiclesLoading(false);
      setAddressesLoading(false);
    }
  }, [user]);

  const handleToggleJobDetail = async (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }

    setExpandedJobId(jobId);
    if (jobDetailsMap[jobId]) return;

    setLoadingJobDetailId(jobId);
    try {
      const { data, error } = await supabase.rpc('get_my_job_detail', {
        p_job_id: jobId,
      });
      if (!error && data) {
        setJobDetailsMap((prev) => ({
          ...prev,
          [jobId]: data as unknown as CustomerJobDetailResponse,
        }));
      }
    } finally {
      setLoadingJobDetailId(null);
    }
  };

  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

  // Profile Form
  const profileSchema = createAccountProfileSchema(t);
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: {
      errors: profileErrors,
      isSubmitting: isSubmittingProfile,
      isDirty: isProfileDirty,
    },
  } = useForm<AccountProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  });

  useEffect(() => {
    if (profile) {
      resetProfile({
        fullName: profile.full_name ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile, resetProfile]);

  const onProfileSubmit = async (values: AccountProfileFormValues) => {
    const { errorCode } = await updateProfile({
      fullName: values.fullName,
      phone: values.phone,
    });

    if (errorCode) {
      toast.error(t(`auth.errors.${errorCode}`));
      return;
    }
    toast.success(t('account.profileUpdated'));
  };

  // Vehicle Form
  const vehicleSchema = createVehicleFormSchema(t);
  const {
    register: registerVehicle,
    handleSubmit: handleSubmitVehicle,
    watch: watchVehicle,
    reset: resetVehicle,
    formState: { errors: vehicleErrors, isSubmitting: isSubmittingVehicle },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make_id: '',
      model_id: '',
      year: new Date().getFullYear() - 2,
      plate_number: '',
      fuel_type: 'petrol',
      nickname: '',
    },
  });

  const watchedMakeId = watchVehicle('make_id');
  const filteredModels = models.filter((m) => m.make_id === watchedMakeId);

  const onVehicleSubmit = async (values: VehicleFormValues) => {
    if (!user) return;
    const { error } = await supabase.from('vehicles').insert({
      user_id: user.id,
      make_id: values.make_id,
      model_id: values.model_id,
      year: values.year,
      plate_number: values.plate_number,
      fuel_type: values.fuel_type,
      nickname: values.nickname,
    });

    if (error) {
      toast.error(t('account.vehicles.saveError'));
      return;
    }

    toast.success(t('account.vehicles.savedSuccess'));
    setVehicleModalOpen(false);
    resetVehicle();
    void loadAccountData();
  };

  const handleDeleteVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      toast.error(t('account.vehicles.deleteError'));
      return;
    }
    toast.success(t('account.vehicles.deletedSuccess'));
    void loadAccountData();
  };

  // Address Form
  const addressSchema = createAddressFormSchema(t);
  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    formState: { errors: addressErrors, isSubmitting: isSubmittingAddress },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      city: 'Sadiqabad',
      address_line: '',
      is_default: addresses.length === 0,
    },
  });

  const onAddressSubmit = async (values: AddressFormValues) => {
    if (!user) return;
    const { error } = await supabase.from('addresses').insert({
      user_id: user.id,
      label: values.label,
      full_name: values.full_name,
      phone: values.phone,
      city: values.city,
      address_line: values.address_line,
      is_default: values.is_default,
    });

    if (error) {
      toast.error(t('account.addresses.saveError'));
      return;
    }

    toast.success(t('account.addresses.savedSuccess'));
    setAddressModalOpen(false);
    resetAddress();
    void loadAccountData();
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) {
      toast.error(t('account.addresses.deleteError'));
      return;
    }
    toast.success(t('account.addresses.deletedSuccess'));
    void loadAccountData();
  };

  // Cancel Booking RPC
  const handleConfirmCancel = async () => {
    if (!confirmCancelBooking) return;
    setCancellingId(confirmCancelBooking.id);
    try {
      const { error } = await supabase.rpc('cancel_my_booking', {
        p_booking_id: confirmCancelBooking.id,
      });

      if (error) {
        const code = error.message || '';
        if (code.includes('cancel_too_late')) {
          toast.error(t('account.bookings.cancelTooLate'));
        } else {
          toast.error(t('account.bookings.cancelError'));
        }
        return;
      }

      toast.success(t('account.bookings.cancelledSuccess'));
      setConfirmCancelBooking(null);
      void loadAccountData();
    } finally {
      setCancellingId(null);
    }
  };

  // Cancel Order RPC
  const handleConfirmCancelOrder = async () => {
    if (!confirmCancelOrder) return;
    setCancellingOrderId(confirmCancelOrder.id);
    try {
      const { error } = await supabase.rpc('cancel_my_order', {
        p_order_id: confirmCancelOrder.id,
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('cannot_cancel')) {
          toast.error(t('account.orders.cannotCancelError'));
        } else {
          toast.error(t('account.orders.cancelError'));
        }
        return;
      }

      toast.success(t('account.orders.cancelledSuccess'));
      setConfirmCancelOrder(null);
      void loadAccountData();
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Reorder items back to cart
  const handleReorder = (ord: CustomerOrderWithDetails) => {
    const items = ord.order_items ?? [];
    let addedCount = 0;
    for (const item of items) {
      if (!item.product_id) continue;
      addItem(
        {
          product_id: item.product_id,
          sku: item.sku,
          slug: '',
          name: item.name_i18n || { en: item.name, ur: '', 'ur-roman': '' },
          unit_price: Number(item.unit_price),
          stock_qty: 20,
        },
        item.quantity,
        false
      );
      addedCount += 1;
    }
    if (addedCount > 0) {
      toast.success(t('account.orders.reorderedToast'));
      openDrawer();
    } else {
      toast.error(t('account.orders.reorderUnavailable'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.logoutSuccess'));
    navigate('/', { replace: true });
  };

  const roleKey = profile?.role ?? 'customer';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8 text-start">
      <Seo title={t('account.seoTitle')} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white heading-accent mb-3">
            {t('account.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">{t('account.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ShieldCheck className="w-4 h-4 text-[#FF6A00]" />}
              >
                {t('nav.adminPanel')}
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            {t('account.signOut')}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {(
          [
            {
              id: 'bookings',
              label: t('account.tabs.bookings'),
              icon: CalendarCheck,
              count: bookings.length,
            },
            {
              id: 'jobs',
              label: t('account.tabs.jobs'),
              icon: Wrench,
              count: jobs.length,
            },
            {
              id: 'orders',
              label: t('account.tabs.orders'),
              icon: Package,
              count: orders.length,
            },
            {
              id: 'vehicles',
              label: t('account.tabs.vehicles'),
              icon: Car,
              count: vehicles.length,
            },
            {
              id: 'addresses',
              label: t('account.tabs.addresses'),
              icon: MapPin,
              count: addresses.length,
            },
            {
              id: 'profile',
              label: t('account.tabs.profile'),
              icon: UserIcon,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
                isCurrent
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {'count' in tab && tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[11px] font-bold',
                    isCurrent ? 'bg-black/25 text-white' : 'bg-white/10 text-[#F5F6F8]'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MY BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold font-heading text-white">
              {t('account.bookings.title')}
            </h2>
            <Link to="/book">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('nav.bookService')}
              </Button>
            </Link>
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              title={t('account.bookings.emptyTitle')}
              description={t('account.bookings.emptyDescription')}
              action={
                <Link to="/book">
                  <Button
                    variant="primary"
                    leftIcon={<CalendarCheck className="w-4 h-4" />}
                  >
                    {t('nav.bookService')}
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((bk) => {
                const cancelCheck = canCustomerCancelBooking(
                  bk.booking_date,
                  bk.slot_start,
                  bk.status
                );
                const srvNames = (bk.booking_services ?? []).map(
                  (s) => s.service_name
                );

                return (
                  <Card key={bk.id} className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <span
                          dir="ltr"
                          className="text-lg font-bold font-mono text-[#FFC21A]"
                        >
                          {bk.booking_no}
                        </span>
                        <Badge variant={getBookingStatusBadgeVariant(bk.status)}>
                          {t(`booking.statuses.${bk.status}`)}
                        </Badge>
                      </div>

                      <div
                        dir="ltr"
                        className="text-xs text-[#8A93A3] flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>
                          {bk.booking_date} •{' '}
                          {formatSlotRange(bk.slot_start, bk.slot_end)} (PKT)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-[#8A93A3] block">
                          {t('booking.summary.vehicle')}
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {[bk.make_text, bk.model_text]
                            .filter(Boolean)
                            .join(' ')}{' '}
                          {bk.vehicle_year ? `(${bk.vehicle_year})` : ''}
                        </p>
                        {bk.plate_number && (
                          <p dir="ltr" className="text-xs font-mono text-[#8A93A3]">
                            {bk.plate_number}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="text-xs text-[#8A93A3] block mb-1">
                          {t('booking.summary.selectedServices')}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {srvNames.map((sn, i) => (
                            <span
                              key={i}
                              className="rounded bg-[#2A2F38] px-2.5 py-0.5 text-xs text-white"
                            >
                              {sn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cancel Action or 3-hour window notice */}
                    {(bk.status === 'pending' || bk.status === 'confirmed') && (
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        {cancelCheck.allowed ? (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-4 h-4" />}
                            onClick={() => setConfirmCancelBooking(bk)}
                          >
                            {t('account.bookings.cancelBtn')}
                          </Button>
                        ) : (
                          <span className="text-xs text-[#8A93A3]">
                            {t('account.bookings.cancelWindowNote')}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1B: MY JOBS (Phase 4 Service History & Invoices via get_my_job_detail RPC) */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold font-heading text-white">
              {t('account.jobs.title')}
            </h2>
            <Link to="/book">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('account.jobs.bookServiceBtn')}
              </Button>
            </Link>
          </div>

          {jobsSchemaMissing ? (
            <Card className="p-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {t('common.databaseSetupNeededTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-[#F5F6F8]/85">
                  {t('common.databaseSetupNeededDesc')}
                </p>
              </div>
            </Card>
          ) : jobsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              title={t('account.jobs.emptyTitle')}
              description={t('account.jobs.emptyDescription')}
              action={
                <Link to="/book">
                  <Button
                    variant="primary"
                    leftIcon={<CalendarCheck className="w-4 h-4" />}
                  >
                    {t('account.jobs.bookServiceBtn')}
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const detail = jobDetailsMap[job.id];
                const isLoadingDetail = loadingJobDetailId === job.id;

                return (
                  <Card key={job.id} className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          dir="ltr"
                          className="text-lg font-bold font-mono text-[#FFC21A]"
                        >
                          {job.job_no}
                        </span>
                        <Badge variant={getJobStatusBadgeVariant(job.status)}>
                          {t(`jobs.statuses.${job.status}`)}
                        </Badge>
                      </div>

                      <div
                        dir="ltr"
                        className="text-xs text-[#8A93A3] flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>
                          {t('account.jobs.receivedOn')}:{' '}
                          {formatKarachiDateTime(job.received_at)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-[#8A93A3] block">
                          {t('booking.summary.vehicle')}
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {[job.make_text, job.model_text]
                            .filter(Boolean)
                            .join(' ')}{' '}
                          {job.vehicle_year ? `(${job.vehicle_year})` : ''}
                        </p>
                        {job.plate_number && (
                          <p
                            dir="ltr"
                            className="text-xs font-mono text-[#8A93A3]"
                          >
                            {job.plate_number}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        {job.estimated_completion && (
                          <div>
                            <span className="text-xs text-[#8A93A3]">
                              {t('account.jobs.eta')}:{' '}
                            </span>
                            <span dir="ltr" className="text-white font-medium">
                              {job.estimated_completion}
                            </span>
                          </div>
                        )}
                        {job.delivered_at && (
                          <div>
                            <span className="text-xs text-[#8A93A3]">
                              {t('account.jobs.deliveredOn')}:{' '}
                            </span>
                            <span dir="ltr" className="text-emerald-300">
                              {formatKarachiDateTime(job.delivered_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {job.public_note && (
                      <div className="rounded bg-[#0E1013] border border-[#FF6A00]/30 p-3 text-xs sm:text-sm">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6A00] block mb-0.5">
                          {t('account.jobs.latestUpdate')}
                        </span>
                        <p className="text-white">{job.public_note}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10 flex justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        rightIcon={
                          isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        }
                        onClick={() => void handleToggleJobDetail(job.id)}
                      >
                        {isExpanded
                          ? t('account.jobs.hideDetailsBtn')
                          : t('account.jobs.viewDetailsBtn')}
                      </Button>
                    </div>

                    {/* Expanded Detail Loaded via SECURITY DEFINER RPC get_my_job_detail */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-white/10 space-y-5">
                        {isLoadingDetail ? (
                          <div className="py-6 flex justify-center">
                            <Spinner size="md" label={t('common.loading')} />
                          </div>
                        ) : !detail ? (
                          <p className="text-xs text-[#8A93A3]">—</p>
                        ) : (
                          <>
                            {/* Work Items (Prices masked when show_cost_to_customer is false) */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <ClipboardList className="w-4 h-4 text-[#FF6A00]" />
                                  <span>{t('account.jobs.workItemsTitle')}</span>
                                </h3>
                                {!detail.show_cost_to_customer && (
                                  <span className="text-xs text-[#8A93A3]">
                                    {t('account.jobs.costsHiddenNote')}
                                  </span>
                                )}
                              </div>

                              {detail.items.length === 0 ? (
                                <p className="text-xs text-[#8A93A3]">—</p>
                              ) : (
                                <div className="overflow-x-auto rounded border border-white/10 bg-[#0E1013]">
                                  <table className="w-full text-xs text-start">
                                    <thead>
                                      <tr className="border-b border-white/10 text-[#8A93A3]">
                                        <th className="py-2 px-3 text-start">
                                          {t('invoices.print.colType')}
                                        </th>
                                        <th className="py-2 px-3 text-start">
                                          {t('invoices.print.colDescription')}
                                        </th>
                                        <th className="py-2 px-3 text-end">
                                          {t('invoices.print.colQty')}
                                        </th>
                                        {detail.show_cost_to_customer && (
                                          <>
                                            <th className="py-2 px-3 text-end">
                                              {t('invoices.print.colUnitPrice')}
                                            </th>
                                            <th className="py-2 px-3 text-end">
                                              {t('invoices.print.colLineTotal')}
                                            </th>
                                          </>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                      {detail.items.map((it) => (
                                        <tr key={it.id}>
                                          <td className="py-2 px-3">
                                            <Badge variant="neutral">
                                              {t(`jobs.itemTypes.${it.item_type}`)}
                                            </Badge>
                                          </td>
                                          <td className="py-2 px-3 text-white">
                                            {it.description}
                                          </td>
                                          <td
                                            dir="ltr"
                                            className="py-2 px-3 text-end tabular-nums text-[#F5F6F8]"
                                          >
                                            {it.quantity}
                                          </td>
                                          {detail.show_cost_to_customer && (
                                            <>
                                              <td
                                                dir="ltr"
                                                className="py-2 px-3 text-end tabular-nums text-[#8A93A3]"
                                              >
                                                {formatPKR(it.unit_price)}
                                              </td>
                                              <td
                                                dir="ltr"
                                                className="py-2 px-3 text-end tabular-nums font-semibold text-white"
                                              >
                                                {formatPKR(it.line_total)}
                                              </td>
                                            </>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>

                            {/* Issued / Paid Invoices */}
                            <div className="space-y-2">
                              <h3 className="text-sm font-bold text-white">
                                {t('account.jobs.invoicesTitle')}
                              </h3>
                              {detail.invoices.length === 0 ? (
                                <p className="text-xs text-[#8A93A3]">
                                  {t('account.jobs.noInvoices')}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {detail.invoices.map((inv) => {
                                    const bal = Math.max(
                                      0,
                                      Number(inv.total ?? 0) -
                                        Number(inv.amount_paid ?? 0)
                                    );
                                    return (
                                      <div
                                        key={inv.id}
                                        className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span
                                              dir="ltr"
                                              className="font-mono font-bold text-[#FFC21A] text-sm"
                                            >
                                              {inv.invoice_no}
                                            </span>
                                            <Badge
                                              variant={getInvoiceStatusBadgeVariant(
                                                inv.status
                                              )}
                                            >
                                              {t(`invoices.statuses.${inv.status}`)}
                                            </Badge>
                                          </div>
                                          <div
                                            dir="ltr"
                                            className="text-xs text-[#8A93A3] flex flex-wrap gap-3"
                                          >
                                            <span>
                                              {t('invoices.print.grandTotal')}:{' '}
                                              <strong className="text-white">
                                                {formatPKR(inv.total)}
                                              </strong>
                                            </span>
                                            <span>
                                              {t('invoices.print.amountPaid')}:{' '}
                                              <strong className="text-emerald-300">
                                                {formatPKR(inv.amount_paid)}
                                              </strong>
                                            </span>
                                            <span>
                                              {t('invoices.print.balanceDue')}:{' '}
                                              <strong className="text-[#FFC21A]">
                                                {formatPKR(bal)}
                                              </strong>
                                            </span>
                                          </div>
                                        </div>

                                        <Link to={`/invoice/${inv.id}/print`}>
                                          <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            leftIcon={
                                              <Printer className="w-3.5 h-3.5" />
                                            }
                                          >
                                            {t('account.jobs.printInvoiceBtn')}
                                          </Button>
                                        </Link>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Progress Notes & Stage Timeline */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A93A3]">
                                  {t('account.jobs.notesTitle')}
                                </h4>
                                {detail.notes.length === 0 ? (
                                  <p className="text-xs text-[#8A93A3]">—</p>
                                ) : (
                                  <div className="space-y-2">
                                    {detail.notes.map((n) => (
                                      <div
                                        key={n.id}
                                        className="rounded bg-[#0E1013] border border-white/10 p-2.5 text-xs space-y-1"
                                      >
                                        <p className="text-white">{n.note}</p>
                                        <span
                                          dir="ltr"
                                          className="text-[11px] text-[#8A93A3] block"
                                        >
                                          {formatKarachiDateTime(n.created_at)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A93A3]">
                                  {t('account.jobs.timelineTitle')}
                                </h4>
                                {detail.history.length === 0 ? (
                                  <p className="text-xs text-[#8A93A3]">—</p>
                                ) : (
                                  <div className="space-y-2">
                                    {detail.history.map((h) => (
                                      <div
                                        key={h.id}
                                        className="rounded bg-[#0E1013] border border-white/10 p-2.5 text-xs space-y-1"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <Badge
                                            variant={getJobStatusBadgeVariant(
                                              h.to_status
                                            )}
                                          >
                                            {t(`jobs.statuses.${h.to_status}`)}
                                          </Badge>
                                          <span
                                            dir="ltr"
                                            className="text-[11px] text-[#8A93A3]"
                                          >
                                            {formatKarachiDateTime(h.created_at)}
                                          </span>
                                        </div>
                                        {h.note && (
                                          <p className="text-[#F5F6F8]/85">
                                            {h.note}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1C: MY ORDERS (Phase 6 Store Orders) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold font-heading text-white">
              {t('account.orders.title')}
            </h2>
            <Link to="/shop">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                {t('account.orders.shopPartsBtn')}
              </Button>
            </Link>
          </div>

          {ordersSchemaMissing ? (
            <Card className="p-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {t('common.databaseSetupNeededTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-[#F5F6F8]/85">
                  {t('common.databaseSetupNeededDesc')}
                </p>
              </div>
            </Card>
          ) : ordersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title={t('account.orders.emptyTitle')}
              description={t('account.orders.emptyDescription')}
              action={
                <Link to="/shop">
                  <Button
                    variant="primary"
                    leftIcon={<ShoppingBag className="w-4 h-4" />}
                  >
                    {t('account.orders.shopPartsBtn')}
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const isExpanded = expandedOrderId === ord.id;
                const items = ord.order_items ?? [];
                const history = (ord.order_status_history ?? []).slice().sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
                const canCancel = canCustomerCancelOrder(ord.status);

                return (
                  <Card key={ord.id} className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          dir="ltr"
                          className="text-lg font-bold font-mono text-[#FFC21A]"
                        >
                          {ord.order_no}
                        </span>
                        <Badge variant={getOrderStatusBadgeVariant(ord.status)}>
                          {t(`orders.statuses.${ord.status}`)}
                        </Badge>
                        <Badge
                          variant={getOrderPaymentStatusBadgeVariant(
                            ord.payment_status
                          )}
                        >
                          {t(`orders.paymentStatuses.${ord.payment_status}`)}
                        </Badge>
                      </div>

                      <div
                        dir="ltr"
                        className="text-xs text-[#8A93A3] flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>{formatKarachiDateTime(ord.placed_at)} (PKT)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-xs text-[#8A93A3] block">
                          {t('account.orders.deliveryAddress')}
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {ord.city}
                        </p>
                        <p className="text-xs text-[#8A93A3] line-clamp-2">
                          {ord.address_line}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs text-[#8A93A3] block">
                          {t('account.orders.itemsSummary')}
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {items.length} {t('catalogue.itemsCount')}
                        </p>
                        <p className="text-xs text-[#8A93A3] truncate">
                          {items
                            .map(
                              (it) =>
                                `${pickLocalized(it.name_i18n, currentLang) || it.name} ×${it.quantity}`
                            )
                            .join(', ')}
                        </p>
                      </div>

                      <div className="sm:text-end">
                        <span className="text-xs text-[#8A93A3] block">
                          {t('cart.summary.total')}
                        </span>
                        <p
                          dir="ltr"
                          className="text-base font-extrabold font-mono text-[#FFC21A] mt-0.5"
                        >
                          {formatPKR(ord.total)}
                        </p>
                        <span className="text-[11px] text-[#8A93A3]">
                          {Number(ord.delivery_charge) === 0
                            ? t('cart.delivery.freeBadge')
                            : `${t('cart.summary.delivery')}: ${formatPKR(ord.delivery_charge)}`}
                        </span>
                      </div>
                    </div>

                    {ord.courier_name && (
                      <div className="rounded-md bg-[#0E1013] border border-[#FF6A00]/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-[#FF6A00]" />
                          <span className="text-white font-semibold">
                            {ord.courier_name}
                          </span>
                          {ord.tracking_number && (
                            <span
                              dir="ltr"
                              className="font-mono text-[#FFC21A] font-bold"
                            >
                              • {ord.tracking_number}
                            </span>
                          )}
                        </div>
                        {ord.tracking_url && (
                          <a
                            href={ord.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#FF6A00] hover:underline font-semibold"
                          >
                            <span>{t('track.orderLookup.openCourierTracking')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          onClick={() => handleReorder(ord)}
                        >
                          {t('account.orders.reorderBtn')}
                        </Button>

                        <Link to={`/order/${ord.id}/print`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<Printer className="w-3.5 h-3.5" />}
                          >
                            {t('account.orders.printReceiptBtn')}
                          </Button>
                        </Link>

                        {canCancel && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => setConfirmCancelOrder(ord)}
                          >
                            {t('account.orders.cancelOrderBtn')}
                          </Button>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rightIcon={
                          isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        }
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : ord.id)
                        }
                      >
                        {isExpanded
                          ? t('account.jobs.hideDetailsBtn')
                          : t('account.jobs.viewDetailsBtn')}
                      </Button>
                    </div>

                    {/* Expanded Order Items & Status History */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="overflow-x-auto rounded border border-white/10 bg-[#0E1013]">
                          <table className="w-full text-xs text-start">
                            <thead>
                              <tr className="border-b border-white/10 text-[#8A93A3]">
                                <th className="py-2 px-3 text-start">SKU</th>
                                <th className="py-2 px-3 text-start">
                                  {t('orders.print.colItem')}
                                </th>
                                <th className="py-2 px-3 text-end">
                                  {t('orders.print.colQty')}
                                </th>
                                <th className="py-2 px-3 text-end">
                                  {t('orders.print.colUnitPrice')}
                                </th>
                                <th className="py-2 px-3 text-end">
                                  {t('orders.print.colTotal')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                              {items.map((it) => (
                                <tr key={it.id}>
                                  <td
                                    dir="ltr"
                                    className="py-2 px-3 font-mono text-[#8A93A3]"
                                  >
                                    {it.sku}
                                  </td>
                                  <td className="py-2 px-3 text-white font-medium">
                                    {pickLocalized(it.name_i18n, currentLang) ||
                                      it.name}
                                  </td>
                                  <td
                                    dir="ltr"
                                    className="py-2 px-3 text-end tabular-nums"
                                  >
                                    {it.quantity}
                                  </td>
                                  <td
                                    dir="ltr"
                                    className="py-2 px-3 text-end tabular-nums text-[#8A93A3]"
                                  >
                                    {formatPKR(it.unit_price)}
                                  </td>
                                  <td
                                    dir="ltr"
                                    className="py-2 px-3 text-end tabular-nums font-semibold text-white"
                                  >
                                    {formatPKR(it.line_total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {history.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A93A3]">
                              {t('track.orderLookup.timelineTitle')}
                            </h4>
                            <div className="space-y-2">
                              {history.map((h) => (
                                <div
                                  key={h.id}
                                  className="rounded bg-[#0E1013] border border-white/10 p-2.5 text-xs flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={getOrderStatusBadgeVariant(
                                        h.to_status
                                      )}
                                    >
                                      {t(`orders.statuses.${h.to_status}`)}
                                    </Badge>
                                    {h.note && (
                                      <span className="text-[#F5F6F8]/85">
                                        {h.note}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    dir="ltr"
                                    className="text-[11px] text-[#8A93A3]"
                                  >
                                    {formatKarachiDateTime(h.created_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold font-heading text-white">
              {t('account.vehicles.title')}
            </h2>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setVehicleModalOpen(true)}
            >
              {t('account.vehicles.addBtn')}
            </Button>
          </div>

          {vehiclesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : vehicles.length === 0 ? (
            <EmptyState
              title={t('account.vehicles.emptyTitle')}
              description={t('account.vehicles.emptyDescription')}
              action={
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setVehicleModalOpen(true)}
                >
                  {t('account.vehicles.addBtn')}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((v) => {
                const mkName =
                  makes.find((m) => m.id === v.make_id)?.name || 'Vehicle';
                const mdName =
                  models.find((m) => m.id === v.model_id)?.name || '';
                return (
                  <Card
                    key={v.id}
                    className="p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-[#FF6A00]" />
                          <h3 className="font-bold text-white">
                            {mkName} {mdName} ({v.year})
                          </h3>
                        </div>
                        {v.nickname && (
                          <p className="text-xs text-[#FFC21A]">{v.nickname}</p>
                        )}
                        <p className="text-xs text-[#8A93A3]">
                          {v.plate_number ? `${v.plate_number} • ` : ''}
                          {t(`booking.fuelTypes.${v.fuel_type}`)}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteVehicle(v.id)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        leftIcon={
                          <ShoppingBag className="w-3.5 h-3.5 text-[#FF6A00]" />
                        }
                        rightIcon={
                          <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                        }
                        onClick={() => {
                          setSelectedVehicle({
                            makeId: v.make_id,
                            makeName: mkName,
                            modelId: v.model_id,
                            modelName: mdName,
                            year: v.year,
                            fuelType: v.fuel_type,
                            includeUniversal: true,
                          });
                          const params = new URLSearchParams({
                            make: v.make_id,
                            model: v.model_id,
                            year: String(v.year),
                            fuel: v.fuel_type,
                          });
                          navigate(`/shop?${params.toString()}`);
                        }}
                      >
                        {t('account.vehicles.shopPartsBtn')}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold font-heading text-white">
              {t('account.addresses.title')}
            </h2>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setAddressModalOpen(true)}
            >
              {t('account.addresses.addBtn')}
            </Button>
          </div>

          {addressesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : addresses.length === 0 ? (
            <EmptyState
              title={t('account.addresses.emptyTitle')}
              description={t('account.addresses.emptyDescription')}
              action={
                <Button
                  type="button"
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setAddressModalOpen(true)}
                >
                  {t('account.addresses.addBtn')}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <Card
                  key={addr.id}
                  className="p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FF6A00]" />
                      <h3 className="font-bold text-white">{addr.label}</h3>
                      {addr.is_default && (
                        <Badge variant="orange">
                          {t('account.addresses.defaultBadge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#F5F6F8]">
                      {addr.address_line}, {addr.city}
                    </p>
                    <p className="text-xs text-[#8A93A3]">
                      {addr.full_name} • {addr.phone}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAddress(addr.id)}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#2A2F38] flex items-center justify-center text-[#FF6A00]">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="text-start">
                <h2 className="text-lg font-bold font-heading text-white">
                  {t('account.profileCardTitle')}
                </h2>
                <p className="text-xs text-[#8A93A3]">{user?.email}</p>
              </div>
            </div>

            <div className="text-xs text-[#8A93A3]">
              <span>{t('account.roleLabel')}: </span>
              <span className="font-semibold text-[#F5F6F8]">
                {t(`account.roles.${roleKey}`)}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmitProfile(onProfileSubmit)}
            noValidate
            className="space-y-4"
          >
            <Input
              label={t('auth.fullNameLabel')}
              type="text"
              placeholder={t('auth.fullNamePlaceholder')}
              error={profileErrors.fullName?.message}
              {...registerProfile('fullName')}
            />

            <Input
              label={t('auth.phoneLabel')}
              type="tel"
              placeholder={t('auth.phonePlaceholder')}
              hint={t('auth.phoneHint')}
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isLoading={isSubmittingProfile}
                disabled={!isProfileDirty}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {isSubmittingProfile
                  ? t('account.saving')
                  : t('account.saveChanges')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal: Confirm Booking Cancellation */}
      <Modal
        isOpen={Boolean(confirmCancelBooking)}
        onClose={() => setConfirmCancelBooking(null)}
        title={t('account.bookings.confirmCancelTitle')}
      >
        <div className="space-y-5 text-start">
          <p className="text-sm text-[#8A93A3]">
            {t('account.bookings.confirmCancelDescription', {
              bookingNo: confirmCancelBooking?.booking_no ?? '',
            })}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmCancelBooking(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={Boolean(cancellingId)}
              onClick={handleConfirmCancel}
            >
              {t('account.bookings.cancelBtn')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirm Order Cancellation */}
      <Modal
        isOpen={Boolean(confirmCancelOrder)}
        onClose={() => setConfirmCancelOrder(null)}
        title={t('account.orders.confirmCancelTitle')}
      >
        <div className="space-y-5 text-start">
          <p className="text-sm text-[#8A93A3]">
            {t('account.orders.confirmCancelDescription', {
              orderNo: confirmCancelOrder?.order_no ?? '',
            })}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmCancelOrder(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={Boolean(cancellingOrderId)}
              onClick={handleConfirmCancelOrder}
            >
              {t('account.orders.cancelOrderBtn')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Saved Vehicle */}
      <Modal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        title={t('account.vehicles.addBtn')}
      >
        <form
          onSubmit={handleSubmitVehicle(onVehicleSubmit)}
          noValidate
          className="space-y-4 text-start"
        >
          <Select
            label={`${t('booking.vehicle.makeLabel')} *`}
            placeholder={t('booking.vehicle.selectMake')}
            options={makes.map((m) => ({ value: m.id, label: m.name }))}
            error={vehicleErrors.make_id?.message}
            {...registerVehicle('make_id')}
          />

          <Select
            label={`${t('booking.vehicle.modelLabel')} *`}
            placeholder={t('booking.vehicle.selectModel')}
            disabled={!watchedMakeId}
            options={filteredModels.map((m) => ({ value: m.id, label: m.name }))}
            error={vehicleErrors.model_id?.message}
            {...registerVehicle('model_id')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t('booking.vehicle.yearLabel')} *`}
              type="number"
              dir="ltr"
              error={vehicleErrors.year?.message}
              {...registerVehicle('year', { valueAsNumber: true })}
            />

            <Select
              label={t('booking.vehicle.fuelTypeLabel')}
              options={[
                { value: 'petrol', label: t('booking.fuelTypes.petrol') },
                { value: 'diesel', label: t('booking.fuelTypes.diesel') },
                { value: 'hybrid', label: t('booking.fuelTypes.hybrid') },
                { value: 'cng', label: t('booking.fuelTypes.cng') },
                { value: 'electric', label: t('booking.fuelTypes.electric') },
              ]}
              error={vehicleErrors.fuel_type?.message}
              {...registerVehicle('fuel_type')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('booking.vehicle.plateLabel')}
              dir="ltr"
              placeholder="LEA-21-1234"
              error={vehicleErrors.plate_number?.message}
              {...registerVehicle('plate_number')}
            />

            <Input
              label={t('account.vehicles.nicknameLabel')}
              placeholder="My Daily Car"
              error={vehicleErrors.nickname?.message}
              {...registerVehicle('nickname')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVehicleModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingVehicle}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Saved Address */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={t('account.addresses.addBtn')}
      >
        <form
          onSubmit={handleSubmitAddress(onAddressSubmit)}
          noValidate
          className="space-y-4 text-start"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t('account.addresses.labelField')} *`}
              placeholder="Home / Office"
              error={addressErrors.label?.message}
              {...registerAddress('label')}
            />
            <Input
              label={`${t('account.addresses.cityField')} *`}
              placeholder="Sadiqabad"
              error={addressErrors.city?.message}
              {...registerAddress('city')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t('auth.fullNameLabel')} *`}
              error={addressErrors.full_name?.message}
              {...registerAddress('full_name')}
            />
            <Input
              label={`${t('auth.phoneLabel')} *`}
              type="tel"
              dir="ltr"
              error={addressErrors.phone?.message}
              {...registerAddress('phone')}
            />
          </div>

          <Input
            label={`${t('account.addresses.addressLineField')} *`}
            placeholder="House / Street / Sector"
            error={addressErrors.address_line?.message}
            {...registerAddress('address_line')}
          />

          <label className="flex items-center gap-2 text-xs text-[#F5F6F8] cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
              {...registerAddress('is_default')}
            />
            <span>{t('account.addresses.setAsDefault')}</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddressModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingAddress}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
