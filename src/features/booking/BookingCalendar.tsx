import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DayAvailabilityStatus } from '../../types/database';
import { getKarachiNowParts } from './bookingUtils';
import { cn } from '../../lib/utils';

export interface BookingCalendarProps {
  year: number;
  month: number; // 1..12
  availabilityMap: Record<string, DayAvailabilityStatus>;
  loading?: boolean;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onChangeMonth: (nextYear: number, nextMonth: number) => void;
}

const SHORT_WEEKDAYS_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function BookingCalendar({
  year,
  month,
  availabilityMap,
  loading = false,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: BookingCalendarProps) {
  const { t, i18n } = useTranslation();
  const pktNow = getKarachiNowParts();

  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstDayOfMonth.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const monthLabel = new Intl.DateTimeFormat(
    i18n.language === 'ur' ? 'ur-PK' : 'en-US',
    {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }
  ).format(firstDayOfMonth);

  const canGoPrev =
    year > pktNow.year || (year === pktNow.year && month > pktNow.month);

  // Allow navigating up to 3 months ahead
  const maxMonthTotal = pktNow.year * 12 + pktNow.month + 3;
  const curMonthTotal = year * 12 + month;
  const canGoNext = curMonthTotal < maxMonthTotal;

  const handlePrev = () => {
    if (!canGoPrev) return;
    if (month === 1) {
      onChangeMonth(year - 1, 12);
    } else {
      onChangeMonth(year, month - 1);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (month === 12) {
      onChangeMonth(year + 1, 1);
    } else {
      onChangeMonth(year, month + 1);
    }
  };

  const cells: Array<{ dayNum: number; dateStr: string } | null> = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, dateStr });
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev}
          aria-label={t('booking.calendar.prevMonth')}
          className="p-2 rounded-md border border-slate-200 text-slate-700 hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 rtl-flip" />
        </button>

        <h3 className="text-base sm:text-lg font-bold font-heading text-[#12151A]">
          {monthLabel}
        </h3>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label={t('booking.calendar.nextMonth')}
          className="p-2 rounded-md border border-slate-200 text-slate-700 hover:border-[#FF6A00] hover:text-[#FF6A00] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rtl-flip" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {SHORT_WEEKDAYS_KEYS.map((k) => (
          <div
            key={k}
            className="text-xs font-semibold text-slate-500 py-1"
          >
            {t(`booking.calendar.weekdays.${k}`)}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-11 sm:h-12" />;
          }

          const status: DayAvailabilityStatus =
            availabilityMap[cell.dateStr] ??
            (cell.dateStr < pktNow.dateStr ? 'past' : 'open');

          const isSelected = selectedDate === cell.dateStr;
          const isInteractive = status === 'open';
          const isToday = cell.dateStr === pktNow.dateStr;

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={!isInteractive || loading}
              onClick={() => isInteractive && onSelectDate(cell.dateStr)}
              title={`${cell.dateStr} — ${t(`booking.calendar.legend.${status}`)}`}
              className={cn(
                'relative h-11 sm:h-12 rounded-md flex flex-col items-center justify-center text-xs sm:text-sm font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
                isSelected
                  ? 'bg-[#FF6A00] text-white border-[#FF6A00] shadow-sm'
                  : status === 'open'
                    ? 'bg-emerald-50/70 text-[#12151A] border-emerald-300 hover:border-[#FF6A00] hover:bg-[#FF6A00]/10 cursor-pointer'
                    : status === 'full'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 opacity-75 cursor-not-allowed'
                      : status === 'blocked'
                        ? 'bg-red-50 text-red-700 border-red-200 opacity-70 cursor-not-allowed'
                        : status === 'closed'
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
              )}
            >
              <span dir="ltr" className="tabular-nums">
                {cell.dayNum}
              </span>
              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Availability Legend */}
      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-400" />
          <span>{t('booking.calendar.legend.open')}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#FF6A00]" />
          <span>{t('booking.calendar.legend.selected')}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
          <span>{t('booking.calendar.legend.full')}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
          <span>{t('booking.calendar.legend.closed')}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
          <span>{t('booking.calendar.legend.blocked')}</span>
        </span>
      </div>
    </div>
  );
}
