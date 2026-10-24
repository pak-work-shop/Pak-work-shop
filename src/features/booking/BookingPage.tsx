import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Image as ImageIcon,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { PAK_MOBILE_REGEX, normalizePakPhoneInput } from '../../lib/validators';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { getLocalized } from '../../i18n/helpers';
import { useAuth } from '../auth/useAuth';
import { useSiteSettings } from '../settings/useSiteSettings';
import { formatServicePriceLabel, useServices } from '../services/useServices';
import {
  useAvailableSlots,
  useBookingSettings,
  useMonthAvailability,
  useVehicleCatalog,
} from './useBookingData';
import {
  formatSlotRange,
  getBookingStatusBadgeVariant,
  getKarachiNowParts,
  normalizeTimeHHMM,
} from './bookingUtils';
import { BookingCalendar } from './BookingCalendar';
import { BookingStatusLookup } from './BookingStatusLookup';
import type {
  AddressRow,
  FuelType,
  SubmitBookingResponse,
  VehicleRow,
} from '../../types/database';
import {
  Badge,
  Button,
  Input,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { PageHeader } from '../../components/common/PageHeader';
import { ServiceIcon } from '../../components/common/ServiceIcon';
import { cn } from '../../lib/utils';

const ALLOWED_PHOTO_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

export default function BookingPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { settings } = useSiteSettings();
  const { services, loading: servicesLoading } = useServices();
  const { bookingSettings, loading: settingsLoading } = useBookingSettings();
  const { makes, models } = useVehicleCatalog();

  const isStatusRoute =
    location.pathname.endsWith('/status') ||
    searchParams.get('tab') === 'status' ||
    Boolean(searchParams.get('booking_no'));

  const [activeTab, setActiveTab] = useState<'book' | 'status'>(
    isStatusRoute ? 'status' : 'book'
  );

  useEffect(() => {
    if (isStatusRoute) {
      setActiveTab('status');
    }
  }, [isStatusRoute]);

  // Wizard step: 1..4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Selected Service IDs (1..5)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const preselectAppliedRef = useRef(false);

  useEffect(() => {
    if (preselectAppliedRef.current || services.length === 0) return;
    const serviceSlugs = searchParams
      .getAll('service')
      .flatMap((s) => s.split(','))
      .map((s) => s.trim())
      .filter(Boolean);
    const serviceIds = searchParams
      .getAll('serviceId')
      .flatMap((s) => s.split(','))
      .map((s) => s.trim())
      .filter(Boolean);

    if (serviceSlugs.length > 0) {
      const matchedIds = services
        .filter((s) => serviceSlugs.includes(s.slug))
        .map((s) => s.id)
        .slice(0, 6);
      if (matchedIds.length > 0) {
        setSelectedServiceIds(matchedIds);
        preselectAppliedRef.current = true;
      }
    } else if (serviceIds.length > 0) {
      const matchedIds = services
        .filter((s) => serviceIds.includes(s.id))
        .map((s) => s.id)
        .slice(0, 6);
      if (matchedIds.length > 0) {
        setSelectedServiceIds(matchedIds);
        preselectAppliedRef.current = true;
      }
    }
  }, [services, searchParams]);

  // Saved customer vehicles & addresses (when logged in)
  const [savedVehicles, setSavedVehicles] = useState<VehicleRow[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<AddressRow[]>([]);

  useEffect(() => {
    if (!user || !env.isConfigured) {
      setSavedVehicles([]);
      setSavedAddresses([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const [vRes, aRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false }),
      ]);

      if (!cancelled) {
        if (!vRes.error && vRes.data) {
          setSavedVehicles(vRes.data as VehicleRow[]);
        }
        if (!aRes.error && aRes.data) {
          setSavedAddresses(aRes.data as AddressRow[]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Step 2: Vehicle state
  const currentYear = new Date().getFullYear();
  const [makeId, setMakeId] = useState<string>('');
  const [makeText, setMakeText] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [modelText, setModelText] = useState<string>('');
  const [vehicleYear, setVehicleYear] = useState<string>(String(currentYear - 2));
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<FuelType | ''>('petrol');
  const [mileageKm, setMileageKm] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>(
    () => searchParams.get('notes') ?? ''
  );
  const [photoPath, setPhotoPath] = useState<string>('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Date & Slot state in Asia/Karachi
  const pktNow = useMemo(() => getKarachiNowParts(), []);
  const [calYear, setCalYear] = useState<number>(pktNow.year);
  const [calMonth, setCalMonth] = useState<number>(pktNow.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [pickupRequested, setPickupRequested] = useState<boolean>(false);
  const [pickupAddress, setPickupAddress] = useState<string>('');

  const {
    days: availabilityMap,
    loading: monthLoading,
    reload: reloadMonth,
  } = useMonthAvailability(calYear, calMonth);

  const {
    slots: availableSlots,
    loading: slotsLoading,
    reload: reloadSlots,
  } = useAvailableSlots(selectedDate);

  // Auto-select first open day in current month if none selected
  useEffect(() => {
    if (selectedDate || monthLoading) return;
    const openDays = Object.entries(availabilityMap)
      .filter(([, st]) => st === 'open')
      .map(([d]) => d)
      .sort();
    if (openDays.length > 0) {
      setSelectedDate(openDays[0]);
    }
  }, [availabilityMap, monthLoading, selectedDate]);

  // Step 4: Customer Contact state
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Pre-fill contact details from authenticated profile
  useEffect(() => {
    if (profile?.full_name && !customerName) {
      setCustomerName(profile.full_name);
    }
    if (profile?.phone && !customerPhone) {
      setCustomerPhone(profile.phone);
    }
    if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  // Confirmation Result
  const [confirmation, setConfirmation] = useState<SubmitBookingResponse | null>(null);
  const [lookupPrefill, setLookupPrefill] = useState<{
    bookingNo: string;
    phone: string;
  }>({
    bookingNo: searchParams.get('booking_no') ?? '',
    phone: searchParams.get('phone') ?? '',
  });

  const filteredModels = useMemo(() => {
    if (!makeId || makeId === '__other__') return [];
    return models.filter((m) => m.make_id === makeId);
  }, [models, makeId]);

  const selectedServicesList = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const selectedSlotObj = useMemo(
    () =>
      availableSlots.find(
        (s) => normalizeTimeHHMM(s.slot_start) === normalizeTimeHHMM(selectedSlotStart)
      ) ?? null,
    [availableSlots, selectedSlotStart]
  );

  const toggleService = (serviceId: string) => {
    setStepError(null);
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      }
      if (prev.length >= 5) {
        toast.error(t('booking.errors.maxServices'));
        return prev;
      }
      return [...prev, serviceId];
    });
  };

  const handleApplySavedVehicle = (v: VehicleRow) => {
    setStepError(null);
    setMakeId(v.make_id);
    setMakeText('');
    setModelId(v.model_id);
    setModelText('');
    setVehicleYear(String(v.year));
    setPlateNumber(v.plate_number || '');
    setFuelType(v.fuel_type || 'petrol');
    toast.success(t('booking.vehicle.savedApplied'));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_MIMES.includes(file.type)) {
      toast.error(t('booking.vehicle.photoInvalidType'));
      e.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(t('booking.vehicle.photoTooLarge'));
      e.target.value = '';
      return;
    }

    if (!env.isConfigured) {
      toast.error(t('booking.vehicle.photoUploadFailed'));
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext =
        file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : 'jpg';
      const randId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const storagePath = `pending/${randId}.${ext}`;

      const { error } = await supabase.storage
        .from('booking-uploads')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        toast.error(t('booking.vehicle.photoUploadFailed'));
        return;
      }

      setPhotoPath(storagePath);
      setPhotoPreviewUrl(URL.createObjectURL(file));
      toast.success(t('booking.vehicle.photoUploaded'));
    } catch {
      toast.error(t('booking.vehicle.photoUploadFailed'));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const validateStep1 = (): boolean => {
    if (selectedServiceIds.length < 1) {
      setStepError(t('booking.errors.selectAtLeastOneService'));
      return false;
    }
    if (selectedServiceIds.length > 5) {
      setStepError(t('booking.errors.maxServices'));
      return false;
    }
    setStepError(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    const hasMake =
      (makeId && makeId !== '__other__') ||
      (makeId === '__other__' && makeText.trim().length >= 2);
    if (!hasMake) {
      setStepError(t('booking.errors.makeRequired'));
      return false;
    }

    const hasModel =
      (modelId && modelId !== '__other__') ||
      ((makeId === '__other__' || modelId === '__other__') &&
        modelText.trim().length >= 1);
    if (!hasModel) {
      setStepError(t('booking.errors.modelRequired'));
      return false;
    }

    const yr = Number(vehicleYear);
    if (Number.isNaN(yr) || yr < 1970 || yr > currentYear + 1) {
      setStepError(t('validation.yearInvalid'));
      return false;
    }

    if (mileageKm.trim() !== '') {
      const m = Number(mileageKm);
      if (Number.isNaN(m) || m < 0 || m > 2000000) {
        setStepError(t('booking.errors.mileageInvalid'));
        return false;
      }
    }

    if (problemDescription.trim().length > 1500) {
      setStepError(t('booking.errors.problemTooLong'));
      return false;
    }

    setStepError(null);
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!selectedDate) {
      setStepError(t('booking.errors.dateRequired'));
      return false;
    }
    if (!selectedSlotStart) {
      setStepError(t('booking.errors.slotRequired'));
      return false;
    }
    if (pickupRequested && bookingSettings.allow_pickup_drop) {
      const addr = pickupAddress.trim();
      if (addr.length < 5 || addr.length > 300) {
        setStepError(t('booking.errors.pickupAddressRequired'));
        return false;
      }
    }
    setStepError(null);
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const resolvedVehicleSummary = useMemo(() => {
    const resolvedMake =
      makeId === '__other__'
        ? makeText.trim()
        : makes.find((m) => m.id === makeId)?.name || makeText.trim();
    const resolvedModel =
      makeId === '__other__' || modelId === '__other__'
        ? modelText.trim()
        : models.find((m) => m.id === modelId)?.name || modelText.trim();
    return `${resolvedMake} ${resolvedModel} (${vehicleYear})`.trim();
  }, [makeId, makeText, makes, modelId, modelText, models, vehicleYear]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    const trimmedName = customerName.trim();
    const normalizedPhone = normalizePakPhoneInput(customerPhone.trim());
    const trimmedEmail = customerEmail.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setStepError(t('validation.nameMin'));
      return;
    }
    if (!PAK_MOBILE_REGEX.test(normalizedPhone)) {
      setStepError(t('validation.phoneInvalid'));
      return;
    }
    if (
      trimmedEmail &&
      (trimmedEmail.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
    ) {
      setStepError(t('validation.emailInvalid'));
      return;
    }

    if (!selectedDate || !selectedSlotStart) {
      setStepError(t('booking.errors.slotRequired'));
      return;
    }

    // Honeypot check: silently fake success
    if (honeypot.trim().length > 0) {
      setConfirmation({
        ok: true,
        booking_id: '00000000-0000-0000-0000-000000000000',
        booking_no: 'BK-000000',
        booking_date: selectedDate,
        slot_start: normalizeTimeHHMM(selectedSlotStart),
        slot_end: normalizeTimeHHMM(selectedSlotObj?.slot_end || selectedSlotStart),
        status: 'pending',
        services: selectedServicesList.map((s) => getLocalized(s, 'name', 'en')),
        vehicle_summary: resolvedVehicleSummary,
      });
      return;
    }

    const resolvedMakeName =
      makeId === '__other__'
        ? makeText.trim()
        : makes.find((m) => m.id === makeId)?.name || makeText.trim();
    const resolvedModelName =
      makeId === '__other__' || modelId === '__other__'
        ? modelText.trim()
        : models.find((m) => m.id === modelId)?.name || modelText.trim();

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('submit_booking', {
        p_customer_name: trimmedName,
        p_customer_phone: normalizedPhone,
        p_customer_email: trimmedEmail || null,
        p_service_ids: selectedServiceIds,
        p_make_id: makeId && makeId !== '__other__' ? makeId : null,
        p_model_id:
          makeId !== '__other__' && modelId && modelId !== '__other__'
            ? modelId
            : null,
        p_make_text: resolvedMakeName || null,
        p_model_text: resolvedModelName || null,
        p_vehicle_year: Number(vehicleYear),
        p_plate_number: plateNumber.trim().toUpperCase() || null,
        p_fuel_type: fuelType || null,
        p_mileage_km: mileageKm.trim() !== '' ? Number(mileageKm) : null,
        p_booking_date: selectedDate,
        p_slot_start: normalizeTimeHHMM(selectedSlotStart),
        p_problem_description: problemDescription.trim() || null,
        p_photo_path: photoPath || null,
        p_pickup_requested:
          bookingSettings.allow_pickup_drop && pickupRequested,
        p_pickup_address:
          bookingSettings.allow_pickup_drop && pickupRequested
            ? pickupAddress.trim()
            : null,
        p_language: i18n.language,
      });

      if (error) {
        const code = error.message || '';
        if (code.includes('slot_unavailable')) {
          const msg = t('booking.errors.slotUnavailable');
          setStepError(msg);
          toast.error(msg);
          void reloadSlots();
          void reloadMonth();
        } else if (code.includes('online_booking_disabled')) {
          const msg = t('booking.errors.onlineBookingDisabled');
          setStepError(msg);
          toast.error(msg);
        } else if (code.includes('rate_limited')) {
          const msg = t('booking.errors.rateLimited');
          setStepError(msg);
          toast.error(msg);
        } else {
          const msg = t('booking.errors.invalidInput');
          setStepError(msg);
          toast.error(msg);
        }
        return;
      }

      if (data) {
        setConfirmation(data as SubmitBookingResponse);
        toast.success(t('booking.confirmation.toastSuccess'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      const msg = t('booking.errors.invalidInput');
      setStepError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const phone = settings.phone || '03126776844';
  const whatsapp = settings.whatsapp || phone;

  return (
    <div className="bg-[#F5F6F8] text-[#12151A] min-h-[75vh]">
      <Seo
        title={t('booking.seoTitle')}
        description={t('booking.seoDescription')}
        canonicalPath="/book"
      />

      <PageHeader
        title={t('booking.pageTitle')}
        subtitle={t('booking.pageSubtitle')}
        breadcrumbs={[{ label: t('nav.bookService') }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Top Mode Switcher: Book Appointment vs Check Booking Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('book');
                setSearchParams({});
              }}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
                activeTab === 'book'
                  ? 'bg-[#FF6A00] text-white'
                  : 'text-slate-700 hover:text-[#12151A]'
              )}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t('booking.tabs.bookAppointment')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer',
                activeTab === 'status'
                  ? 'bg-[#FF6A00] text-white'
                  : 'text-slate-700 hover:text-[#12151A]'
              )}
            >
              <Search className="w-4 h-4" />
              <span>{t('booking.tabs.checkStatus')}</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>{t('booking.timezoneNotice')}</span>
          </div>
        </div>

        {activeTab === 'status' ? (
          <BookingStatusLookup
            initialBookingNo={lookupPrefill.bookingNo}
            initialPhone={lookupPrefill.phone}
          />
        ) : settingsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-full bg-slate-200" />
            <Skeleton className="h-96 w-full bg-slate-200" />
          </div>
        ) : !bookingSettings.online_booking_enabled ? (
          /* Online Booking Disabled Notice */
          <div className="rounded-lg bg-white border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-[#FF6A00] flex items-center justify-center mx-auto">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-[#12151A]">
              {t('booking.disabled.title')}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('booking.disabled.description')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a href={`tel:${phone}`}>
                <Button
                  variant="primary"
                  leftIcon={<Phone className="w-4 h-4" />}
                >
                  {t('booking.disabled.callToBook')}: {phone}
                </Button>
              </a>
              <a
                href={buildWhatsAppUrl(whatsapp, t('booking.disabled.whatsappPrefill'))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="secondary"
                  leftIcon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
                >
                  {t('booking.disabled.whatsappToBook')}
                </Button>
              </a>
            </div>
          </div>
        ) : confirmation ? (
          /* Confirmation Screen */
          <div className="max-w-3xl mx-auto rounded-lg bg-white border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 text-start">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-heading text-[#12151A]">
                    {t('booking.confirmation.title')}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {t('booking.confirmation.subtitle')}
                  </p>
                </div>
              </div>

              <Badge variant={getBookingStatusBadgeVariant(confirmation.status)}>
                {t(`booking.statuses.${confirmation.status}`)}
              </Badge>
            </div>

            {/* Booking Reference Number Box */}
            <div className="rounded-lg bg-[#0E1013] text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[#8A93A3] block">
                  {t('booking.confirmation.referenceNo')}
                </span>
                <span
                  dir="ltr"
                  className="text-2xl sm:text-3xl font-bold font-mono text-[#FFC21A] tracking-wider mt-1 block"
                >
                  {confirmation.booking_no}
                </span>
                <span className="text-xs text-[#8A93A3] mt-1 block">
                  {t('booking.confirmation.saveReferenceHint')}
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="print:hidden"
                leftIcon={<Copy className="w-4 h-4 text-[#FF6A00]" />}
                onClick={() => {
                  void navigator.clipboard.writeText(confirmation.booking_no);
                  toast.success(t('booking.confirmation.copied'));
                }}
              >
                {t('booking.confirmation.copyBtn')}
              </Button>
            </div>

            {/* Appointment Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-md bg-slate-50 border border-slate-200 p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  {t('booking.summary.dateAndSlot')}
                </span>
                <p dir="ltr" className="font-bold text-[#12151A]">
                  {confirmation.booking_date}
                </p>
                <p dir="ltr" className="text-xs text-slate-600">
                  {formatSlotRange(confirmation.slot_start, confirmation.slot_end)} (PKT)
                </p>
              </div>

              <div className="rounded-md bg-slate-50 border border-slate-200 p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  {t('booking.summary.vehicle')}
                </span>
                <p className="font-bold text-[#12151A]">
                  {confirmation.vehicle_summary}
                </p>
                {plateNumber && (
                  <p dir="ltr" className="text-xs font-mono text-slate-600">
                    {plateNumber.toUpperCase()}
                  </p>
                )}
              </div>
            </div>

            {/* Selected Services */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">
                {t('booking.summary.selectedServices')}
              </span>
              <div className="flex flex-wrap gap-2">
                {confirmation.services.map((srv, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#12151A]"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 print:hidden">
              <a
                href={buildWhatsAppUrl(
                  whatsapp,
                  t('booking.confirmation.whatsappMessage', {
                    bookingNo: confirmation.booking_no,
                    name: customerName.trim(),
                    vehicle: confirmation.vehicle_summary,
                    date: confirmation.booking_date,
                    slot: formatSlotRange(confirmation.slot_start, confirmation.slot_end),
                    services: confirmation.services.join(', '),
                  })
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="primary"
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                >
                  {t('booking.confirmation.sendWhatsappBtn')}
                </Button>
              </a>

              <Button
                type="button"
                variant="secondary"
                leftIcon={<Printer className="w-4 h-4 text-[#FF6A00]" />}
                onClick={() => window.print()}
              >
                {t('booking.confirmation.printBtn')}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:text-[#12151A]"
                leftIcon={<Search className="w-4 h-4" />}
                onClick={() => {
                  setLookupPrefill({
                    bookingNo: confirmation.booking_no,
                    phone: normalizePakPhoneInput(customerPhone),
                  });
                  setActiveTab('status');
                }}
              >
                {t('booking.confirmation.checkStatusBtn')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="text-slate-600 hover:text-[#12151A]"
                onClick={() => {
                  setConfirmation(null);
                  setStep(1);
                  setSelectedSlotStart(null);
                }}
              >
                {t('booking.confirmation.bookAnotherBtn')}
              </Button>
            </div>
          </div>
        ) : (
          /* 4-Step Booking Wizard */
          <div className="space-y-8">
            {/* Stepper Progress Header */}
            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(
                [
                  { num: 1, label: t('booking.steps.services') },
                  { num: 2, label: t('booking.steps.vehicle') },
                  { num: 3, label: t('booking.steps.dateAndTime') },
                  { num: 4, label: t('booking.steps.contactAndConfirm') },
                ] as const
              ).map((s) => {
                const isCurrent = step === s.num;
                const isDone = step > s.num;
                return (
                  <li
                    key={s.num}
                    className={cn(
                      'rounded-lg border px-3.5 py-3 flex items-center gap-3 text-start transition-colors',
                      isCurrent
                        ? 'bg-[#0E1013] text-white border-[#FF6A00]'
                        : isDone
                          ? 'bg-white text-[#12151A] border-emerald-400'
                          : 'bg-white/70 text-slate-500 border-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        isCurrent
                          ? 'bg-[#FF6A00] text-white'
                          : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : s.num}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold truncate">
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            {stepError && (
              <div
                role="alert"
                className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-start"
              >
                {stepError}
              </div>
            )}

            {/* STEP 1: Select 1..5 Services */}
            {step === 1 && (
              <div className="space-y-6 text-start">
                <div className="rounded-lg bg-white border border-slate-200 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-[#12151A]">
                      {t('booking.step1.title')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      {t('booking.step1.subtitle')}
                    </p>
                  </div>

                  <Badge variant={selectedServiceIds.length > 0 ? 'orange' : 'neutral'}>
                    {t('booking.step1.selectedCount', {
                      count: selectedServiceIds.length,
                    })}
                  </Badge>
                </div>

                {/* Price Disclaimer Banner */}
                <div className="rounded-lg bg-[#0E1013] text-[#F5F6F8] border border-white/10 px-4 py-3 flex items-center gap-3 text-xs">
                  <Info className="w-4 h-4 text-[#FF6A00] shrink-0" />
                  <span>{t('services.priceDisclaimer')}</span>
                </div>

                {servicesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-44 w-full bg-slate-200" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      const name = getLocalized(service, 'name', i18n.language);
                      const shortDesc = getLocalized(
                        service,
                        'short_description',
                        i18n.language
                      );
                      const estTime = getLocalized(
                        service,
                        'estimated_time',
                        i18n.language
                      );
                      const priceNote = getLocalized(
                        service,
                        'price_note',
                        i18n.language
                      );
                      const priceLabel = formatServicePriceLabel(service, t);
                      const imgUrl = service.image_url?.trim();

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={cn(
                            'group rounded-lg border overflow-hidden text-start flex flex-col justify-between transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
                            isSelected
                              ? 'bg-[#0E1013] text-white border-[#FF6A00] ring-2 ring-[#FF6A00]/30 shadow-md'
                              : 'bg-white text-[#12151A] border-slate-200 hover:border-[#FF6A00]'
                          )}
                        >
                          <div className="w-full">
                            {imgUrl && (
                              <div
                                className={cn(
                                  'aspect-video w-full overflow-hidden bg-[#1B1F26] border-b',
                                  isSelected ? 'border-white/10' : 'border-slate-200'
                                )}
                              >
                                <img
                                  src={imgUrl}
                                  alt={name}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-5 pb-2 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-md flex items-center justify-center shrink-0',
                                    isSelected
                                      ? 'bg-[#FF6A00] text-white'
                                      : 'bg-[#0E1013] text-[#FF6A00]'
                                  )}
                                >
                                  <ServiceIcon name={service.icon} className="w-5 h-5" />
                                </div>

                                <span
                                  className={cn(
                                    'w-6 h-6 rounded-full border flex items-center justify-center',
                                    isSelected
                                      ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                                      : 'border-slate-300'
                                  )}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </span>
                              </div>

                              <h3 className="text-base font-bold font-heading">
                                {name}
                              </h3>

                              {shortDesc && (
                                <p
                                  className={cn(
                                    'text-xs line-clamp-2',
                                    isSelected ? 'text-[#8A93A3]' : 'text-slate-600'
                                  )}
                                >
                                  {shortDesc}
                                </p>
                              )}
                            </div>
                          </div>

                          <div
                            className={cn(
                              'px-5 pb-5 pt-3 mt-2 border-t space-y-1 text-xs w-full',
                              isSelected ? 'border-white/10' : 'border-slate-100'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  'font-semibold',
                                  isSelected ? 'text-[#FFC21A]' : 'text-[#12151A]'
                                )}
                              >
                                {priceLabel}
                              </span>
                              {estTime && (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1',
                                    isSelected ? 'text-[#8A93A3]' : 'text-slate-500'
                                  )}
                                >
                                  <Clock className="w-3 h-3 text-[#FF6A00]" />
                                  <span>{estTime}</span>
                                </span>
                              )}
                            </div>
                            {priceNote && (
                              <p
                                className={cn(
                                  'text-[11px] truncate',
                                  isSelected ? 'text-[#8A93A3]' : 'text-slate-500'
                                )}
                              >
                                {priceNote}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleNextStep}
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('booking.actions.continueToVehicle')}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Vehicle Details & Problem Description */}
            {step === 2 && (
              <div className="rounded-lg bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-start">
                <div>
                  <h2 className="text-xl font-bold font-heading text-[#12151A]">
                    {t('booking.step2.title')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {t('booking.step2.subtitle')}
                  </p>
                </div>

                {/* Saved Vehicles Quick Selector (when logged in) */}
                {savedVehicles.length > 0 && (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-[#FF6A00]" />
                      <span>{t('booking.vehicle.selectSavedVehicle')}</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {savedVehicles.map((sv) => {
                        const mkName =
                          makes.find((m) => m.id === sv.make_id)?.name || '';
                        const mdName =
                          models.find((m) => m.id === sv.model_id)?.name || '';
                        return (
                          <button
                            key={sv.id}
                            type="button"
                            onClick={() => handleApplySavedVehicle(sv)}
                            className="rounded-md bg-white hover:border-[#FF6A00] border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#12151A] transition-colors cursor-pointer"
                          >
                            {sv.nickname
                              ? `${sv.nickname} — ${mkName} ${mdName} (${sv.year})`
                              : `${mkName} ${mdName} (${sv.year})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={`${t('booking.vehicle.makeLabel')} *`}
                    lightMode
                    value={makeId}
                    onChange={(e) => {
                      const nextMake = e.target.value;
                      setMakeId(nextMake);
                      setModelId(nextMake === '__other__' ? '__other__' : '');
                    }}
                    placeholder={t('booking.vehicle.selectMake')}
                    options={[
                      ...makes.map((m) => ({ value: m.id, label: m.name })),
                      { value: '__other__', label: t('booking.vehicle.otherMake') },
                    ]}
                  />

                  {makeId === '__other__' ? (
                    <Input
                      label={`${t('booking.vehicle.customMakeLabel')} *`}
                      lightMode
                      value={makeText}
                      onChange={(e) => setMakeText(e.target.value)}
                      placeholder="e.g. Nissan, Mitsubishi"
                    />
                  ) : (
                    <Select
                      label={`${t('booking.vehicle.modelLabel')} *`}
                      lightMode
                      value={modelId}
                      disabled={!makeId}
                      onChange={(e) => setModelId(e.target.value)}
                      placeholder={t('booking.vehicle.selectModel')}
                      options={[
                        ...filteredModels.map((m) => ({
                          value: m.id,
                          label: m.name,
                        })),
                        {
                          value: '__other__',
                          label: t('booking.vehicle.otherModel'),
                        },
                      ]}
                    />
                  )}

                  {(makeId === '__other__' || modelId === '__other__') && (
                    <Input
                      label={`${t('booking.vehicle.customModelLabel')} *`}
                      lightMode
                      value={modelText}
                      onChange={(e) => setModelText(e.target.value)}
                      placeholder="e.g. Dayz, Lancer, Vitz"
                    />
                  )}

                  <Input
                    label={`${t('booking.vehicle.yearLabel')} *`}
                    type="number"
                    dir="ltr"
                    lightMode
                    min={1970}
                    max={currentYear + 1}
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                  />

                  <Input
                    label={t('booking.vehicle.plateLabel')}
                    dir="ltr"
                    lightMode
                    placeholder="LEA-21-1234"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  />

                  <Select
                    label={t('booking.vehicle.fuelTypeLabel')}
                    lightMode
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType | '')}
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
                    lightMode
                    min={0}
                    max={2000000}
                    placeholder="45000"
                    value={mileageKm}
                    onChange={(e) => setMileageKm(e.target.value)}
                  />
                </div>

                <Textarea
                  label={t('booking.vehicle.problemLabel')}
                  lightMode
                  rows={3}
                  placeholder={t('booking.vehicle.problemPlaceholder')}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  hint={`${problemDescription.length} / 1500`}
                />

                {/* Optional Photo Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#12151A]">
                    {t('booking.vehicle.photoLabel')}
                  </label>
                  <p className="text-xs text-slate-500">
                    {t('booking.vehicle.photoHint')}
                  </p>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={uploadingPhoto}
                      className="border-slate-300 text-slate-700 hover:text-[#12151A]"
                      leftIcon={<Upload className="w-4 h-4 text-[#FF6A00]" />}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {uploadingPhoto
                        ? t('admin.shared.uploading')
                        : t('booking.vehicle.uploadPhotoBtn')}
                    </Button>

                    {photoPath && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => {
                          setPhotoPath('');
                          setPhotoPreviewUrl('');
                        }}
                      >
                        {t('admin.shared.removeImage')}
                      </Button>
                    )}
                  </div>

                  {photoPreviewUrl && (
                    <div className="pt-2">
                      <img
                        src={photoPreviewUrl}
                        alt="Uploaded issue preview"
                        className="h-28 w-auto rounded-md border border-slate-200 object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:text-[#12151A]"
                    leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
                    onClick={() => setStep(1)}
                  >
                    {t('booking.actions.back')}
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextStep}
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('booking.actions.continueToDate')}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Date & Time Slot (PKT) */}
            {step === 3 && (
              <div className="space-y-6 text-start">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Calendar */}
                  <div className="lg:col-span-7">
                    <BookingCalendar
                      year={calYear}
                      month={calMonth}
                      availabilityMap={availabilityMap}
                      loading={monthLoading}
                      selectedDate={selectedDate}
                      onSelectDate={(dateStr) => {
                        setStepError(null);
                        setSelectedDate(dateStr);
                        setSelectedSlotStart(null);
                      }}
                      onChangeMonth={(ny, nm) => {
                        setCalYear(ny);
                        setCalMonth(nm);
                      }}
                    />
                  </div>

                  {/* Right: Time Slots for Selected Date */}
                  <div className="lg:col-span-5 rounded-lg bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-lg font-bold font-heading text-[#12151A]">
                        {t('booking.step3.slotsTitle')}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedDate
                          ? `${t('booking.step3.slotsForDate')}: ${selectedDate}`
                          : t('booking.step3.selectDatePrompt')}
                      </p>
                    </div>

                    {!selectedDate ? (
                      <div className="rounded-md bg-slate-50 border border-slate-200 p-6 text-center text-xs text-slate-500">
                        {t('booking.step3.selectDatePrompt')}
                      </div>
                    ) : slotsLoading ? (
                      <div className="grid grid-cols-2 gap-2.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full bg-slate-200" />
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                        {t('booking.step3.noSlotsForDate')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pe-1">
                        {availableSlots.map((slot) => {
                          const startNorm = normalizeTimeHHMM(slot.slot_start);
                          const isSelected =
                            normalizeTimeHHMM(selectedSlotStart) === startNorm;
                          const isFull = slot.remaining <= 0;

                          return (
                            <button
                              key={startNorm}
                              type="button"
                              disabled={isFull}
                              onClick={() => {
                                setStepError(null);
                                setSelectedSlotStart(startNorm);
                              }}
                              className={cn(
                                'rounded-md border px-3.5 py-3 flex items-center justify-between gap-2 text-start transition-all',
                                isSelected
                                  ? 'bg-[#0E1013] text-white border-[#FF6A00] ring-2 ring-[#FF6A00]/30'
                                  : isFull
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-[#12151A] border-slate-200 hover:border-[#FF6A00] cursor-pointer'
                              )}
                            >
                              <span
                                dir="ltr"
                                className="text-xs sm:text-sm font-bold tabular-nums"
                              >
                                {formatSlotRange(slot.slot_start, slot.slot_end)}
                              </span>

                              <span
                                className={cn(
                                  'text-[11px] font-semibold px-2 py-0.5 rounded',
                                  isFull
                                    ? 'bg-slate-200 text-slate-600'
                                    : isSelected
                                      ? 'bg-[#FF6A00] text-white'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                )}
                              >
                                {isFull
                                  ? t('booking.step3.slotFull')
                                  : t('booking.step3.spotsLeft', {
                                      count: slot.remaining,
                                    })}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pickup & Drop-off Option (when enabled in booking_settings) */}
                {bookingSettings.allow_pickup_drop && (
                  <div className="rounded-lg bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pickupRequested}
                        onChange={(e) => setPickupRequested(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#FF6A00] focus:ring-[#FF6A00]"
                      />
                      <div>
                        <span className="text-sm font-bold text-[#12151A] block">
                          {t('booking.pickup.requestLabel')}
                        </span>
                        <span className="text-xs text-slate-600">
                          {t('booking.pickup.requestHint')}
                        </span>
                      </div>
                    </label>

                    {pickupRequested && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        {savedAddresses.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-slate-600 block">
                              {t('booking.pickup.useSavedAddress')}:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {savedAddresses.map((addr) => (
                                <button
                                  key={addr.id}
                                  type="button"
                                  onClick={() =>
                                    setPickupAddress(
                                      `${addr.address_line}, ${addr.city}`
                                    )
                                  }
                                  className="rounded bg-slate-100 hover:bg-[#FF6A00] hover:text-white border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
                                >
                                  {addr.label}: {addr.address_line}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <Input
                          label={`${t('booking.pickup.addressLabel')} *`}
                          lightMode
                          placeholder={t('booking.pickup.addressPlaceholder')}
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:text-[#12151A]"
                    leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
                    onClick={() => setStep(2)}
                  >
                    {t('booking.actions.back')}
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNextStep}
                    rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                  >
                    {t('booking.actions.continueToContact')}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Customer Contact & Final Review */}
            {step === 4 && (
              <form
                onSubmit={handleSubmitBooking}
                noValidate
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-start"
              >
                {/* Left: Contact Fields */}
                <div className="lg:col-span-7 rounded-lg bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold font-heading text-[#12151A]">
                        {t('booking.step4.title')}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        {t('booking.step4.subtitle')}
                      </p>
                    </div>
                    {user && (
                      <Badge variant="success">
                        <UserCheck className="w-3.5 h-3.5 me-1" />
                        {t('booking.step4.linkedToAccount')}
                      </Badge>
                    )}
                  </div>

                  {/* Honeypot field */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <Input
                    label={`${t('contact.form.nameLabel')} *`}
                    lightMode
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('contact.form.namePlaceholder')}
                  />

                  <Input
                    label={`${t('contact.form.phoneLabel')} *`}
                    type="tel"
                    dir="ltr"
                    lightMode
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03126776844"
                    hint={t('auth.phoneHint')}
                  />

                  <Input
                    label={t('contact.form.emailLabel')}
                    type="email"
                    dir="ltr"
                    lightMode
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={t('contact.form.emailPlaceholder')}
                  />

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:text-[#12151A]"
                      leftIcon={<ArrowLeft className="w-4 h-4 rtl-flip" />}
                      onClick={() => setStep(3)}
                    >
                      {t('booking.actions.back')}
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={submitting}
                      leftIcon={<CalendarCheck className="w-4 h-4" />}
                    >
                      {submitting
                        ? t('booking.actions.submitting')
                        : t('booking.actions.confirmBooking')}
                    </Button>
                  </div>
                </div>

                {/* Right: Booking Summary Card */}
                <aside className="lg:col-span-5 rounded-lg bg-[#0E1013] text-[#F5F6F8] border border-white/15 p-6 space-y-5">
                  <h3 className="text-lg font-bold font-heading text-white border-b border-white/10 pb-3">
                    {t('booking.summary.title')}
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-xs text-[#8A93A3] block">
                        {t('booking.summary.dateAndSlot')}
                      </span>
                      <p dir="ltr" className="font-bold text-[#FFC21A] mt-0.5">
                        {selectedDate} •{' '}
                        {formatSlotRange(
                          selectedSlotStart,
                          selectedSlotObj?.slot_end
                        )}{' '}
                        (PKT)
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-[#8A93A3] block">
                        {t('booking.summary.vehicle')}
                      </span>
                      <p className="font-semibold text-white mt-0.5">
                        {resolvedVehicleSummary}
                      </p>
                      {plateNumber && (
                        <p dir="ltr" className="text-xs font-mono text-[#8A93A3]">
                          {plateNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-[#8A93A3] block mb-1.5">
                        {t('booking.summary.selectedServices')} (
                        {selectedServicesList.length})
                      </span>
                      <ul className="space-y-1.5">
                        {selectedServicesList.map((srv) => (
                          <li
                            key={srv.id}
                            className="flex items-center justify-between gap-2 rounded bg-[#1B1F26] px-3 py-1.5"
                          >
                            <span className="font-medium text-white">
                              {getLocalized(srv, 'name', i18n.language)}
                            </span>
                            <span className="text-xs text-[#FFC21A]">
                              {formatServicePriceLabel(srv, t)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {pickupRequested && bookingSettings.allow_pickup_drop && (
                      <div className="rounded bg-[#1B1F26] border border-white/10 p-3">
                        <span className="text-xs font-semibold text-emerald-400 block">
                          {t('booking.summary.pickupRequested')}
                        </span>
                        <p className="text-xs text-[#F5F6F8] mt-0.5">
                          {pickupAddress}
                        </p>
                      </div>
                    )}

                    {photoPath && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <ImageIcon className="w-4 h-4" />
                        <span>{t('booking.vehicle.photoUploaded')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 text-xs text-[#8A93A3] flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
                    <span>{t('services.priceDisclaimer')}</span>
                  </div>
                </aside>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
