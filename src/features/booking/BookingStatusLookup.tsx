import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Car,
  Clock,
  FlaskConical,
  History,
  MapPin,
  Search,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  createBookingLookupSchema,
  type BookingLookupFormValues,
} from '../../lib/validators';
import type { BookingLookupResponse } from '../../types/database';
import { useSiteSettings } from '../settings/useSiteSettings';
import {
  formatSlotRange,
  getBookingStatusBadgeVariant,
} from './bookingUtils';
import { Badge, Button, Input } from '../../components/ui';

export interface BookingStatusLookupProps {
  initialBookingNo?: string;
  initialPhone?: string;
}

const DEMO_SAMPLE_LOOKUPS = [
  { booking_no: 'BK-000101', phone: '03000000001', label: 'BK-000101 (In Progress)' },
  { booking_no: 'BK-000103', phone: '03000000003', label: 'BK-000103 (Pending)' },
  { booking_no: 'BK-000106', phone: '03000000006', label: 'BK-000106 (Completed)' },
];

export function BookingStatusLookup({
  initialBookingNo = '',
  initialPhone = '',
}: BookingStatusLookupProps) {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const [result, setResult] = useState<BookingLookupResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const schema = createBookingLookupSchema(t);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingLookupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      booking_no: initialBookingNo,
      phone: initialPhone,
    },
  });

  const performLookup = async (values: BookingLookupFormValues) => {
    setLookupError(null);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc('get_booking_status', {
        p_booking_no: values.booking_no.trim().toUpperCase(),
        p_phone: values.phone.trim(),
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('rate_limited')) {
          setLookupError(t('booking.lookup.errors.rateLimited'));
        } else {
          setLookupError(t('booking.lookup.errors.notFound'));
        }
        return;
      }

      if (data) {
        setResult(data as BookingLookupResponse);
      } else {
        setLookupError(t('booking.lookup.errors.notFound'));
      }
    } catch {
      setLookupError(t('booking.lookup.errors.notFound'));
    }
  };

  useEffect(() => {
    if (initialBookingNo && initialPhone) {
      setValue('booking_no', initialBookingNo);
      setValue('phone', initialPhone);
      void performLookup({
        booking_no: initialBookingNo,
        phone: initialPhone,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBookingNo, initialPhone]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-start">
      <div className="rounded-lg bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#12151A]">
            {t('booking.lookup.title')}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {t('booking.lookup.subtitle')}
          </p>
        </div>

        {/* Quick Demo Samples when Demo Mode is active */}
        {settings.demo_mode && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <FlaskConical className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>{t('booking.lookup.demoSamplesTitle')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_SAMPLE_LOOKUPS.map((sample) => (
                <button
                  key={sample.booking_no}
                  type="button"
                  onClick={() => {
                    setValue('booking_no', sample.booking_no, { shouldValidate: true });
                    setValue('phone', sample.phone, { shouldValidate: true });
                    void performLookup({
                      booking_no: sample.booking_no,
                      phone: sample.phone,
                    });
                  }}
                  className="rounded bg-white hover:bg-[#FF6A00] hover:text-white border border-amber-300 px-2.5 py-1 text-xs font-mono font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(performLookup)}
          noValidate
          className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start"
        >
          <div className="sm:col-span-5">
            <Input
              label={t('booking.lookup.bookingNoLabel')}
              placeholder="BK-000001"
              dir="ltr"
              lightMode
              error={errors.booking_no?.message}
              {...register('booking_no')}
            />
          </div>

          <div className="sm:col-span-5">
            <Input
              label={t('booking.lookup.phoneLabel')}
              placeholder="03126776844"
              type="tel"
              dir="ltr"
              lightMode
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="sm:col-span-2 sm:pt-7">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              leftIcon={<Search className="w-4 h-4" />}
            >
              {t('booking.lookup.searchBtn')}
            </Button>
          </div>
        </form>

        {lookupError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700"
          >
            {lookupError}
          </div>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div className="rounded-lg bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                {t('booking.confirmation.referenceNo')}
              </span>
              <span
                dir="ltr"
                className="text-2xl font-bold font-mono text-[#12151A]"
              >
                {result.booking_no}
              </span>
            </div>

            <Badge variant={getBookingStatusBadgeVariant(result.status)}>
              {t(`booking.statuses.${result.status}`)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-md bg-slate-50 border border-slate-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Calendar className="w-4 h-4 text-[#FF6A00]" />
                <span>{t('booking.summary.dateAndSlot')}</span>
              </div>
              <p dir="ltr" className="font-semibold text-[#12151A]">
                {result.booking_date}
              </p>
              <p dir="ltr" className="text-xs text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>{formatSlotRange(result.slot_start, result.slot_end)} (PKT)</span>
              </p>
            </div>

            <div className="rounded-md bg-slate-50 border border-slate-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Car className="w-4 h-4 text-[#FF6A00]" />
                <span>{t('booking.summary.vehicle')}</span>
              </div>
              <p className="font-semibold text-[#12151A]">
                {result.vehicle_summary || '—'}
              </p>
              {result.pickup_requested && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t('booking.summary.pickupRequested')}</span>
                </p>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Wrench className="w-4 h-4 text-[#FF6A00]" />
              <span>{t('booking.summary.selectedServices')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(result.services ?? []).map((srv, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-[#12151A]"
                >
                  {srv}
                </span>
              ))}
            </div>
          </div>

          {/* Status History Timeline */}
          {Array.isArray(result.history) && result.history.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <History className="w-4 h-4 text-[#FF6A00]" />
                <span>{t('booking.lookup.historyTitle')}</span>
              </div>

              <ol className="space-y-3 ps-2 border-s-2 border-slate-200">
                {result.history.map((item, idx) => (
                  <li key={idx} className="ps-3 relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A00] absolute -start-[6px] top-1.5" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#12151A]">
                        {t(`booking.statuses.${item.to_status}`)}
                      </span>
                      <span dir="ltr" className="text-[11px] text-slate-500 tabular-nums">
                        {new Date(item.created_at).toLocaleString('en-PK', {
                          timeZone: 'Asia/Karachi',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-slate-600 mt-0.5">{item.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
