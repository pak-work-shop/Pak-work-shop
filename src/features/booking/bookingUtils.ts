import type { BookingStatus } from '../../types/database';
import type { BadgeVariant } from '../../components/ui/Badge';

/**
 * Returns the current date/time parts in Asia/Karachi timezone.
 */
export function getKarachiNowParts(): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dateStr: string;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const year = Number(map.year || 2026);
  const month = Number(map.month || 1);
  const day = Number(map.day || 1);
  const hour = Number(map.hour === '24' ? '0' : map.hour || 0);
  const minute = Number(map.minute || 0);
  const dateStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, hour, minute, dateStr };
}

/**
 * Adds `offsetDays` to a YYYY-MM-DD date string safely in UTC calendar arithmetic.
 */
export function addDaysToDateStr(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + offsetDays));
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const rd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

/**
 * Normalizes a SQL time string ('09:00:00' or '09:00') to 'HH:mm'.
 */
export function normalizeTimeHHMM(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  return trimmed.slice(0, 5);
}

/**
 * Formats 'HH:mm' or 'HH:mm:ss' into 12-hour format (e.g. '09:00 AM').
 */
export function formatTime12h(timeStr: string | null | undefined): string {
  const hhmm = normalizeTimeHHMM(timeStr);
  if (!hhmm || !hhmm.includes(':')) return hhmm;
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${mStr} ${period}`;
}

export function formatSlotRange(
  startStr: string | null | undefined,
  endStr: string | null | undefined
): string {
  const start = formatTime12h(startStr);
  const end = formatTime12h(endStr);
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

/**
 * Checks whether a customer can cancel their own booking:
 * - Status must be 'pending' or 'confirmed'
 * - Slot start in Asia/Karachi (+05:00) must be at least 3 hours in the future
 */
export function canCustomerCancelBooking(
  bookingDate: string,
  slotStart: string,
  status: BookingStatus
): { allowed: boolean; reason?: 'status' | 'too_late' } {
  if (status !== 'pending' && status !== 'confirmed') {
    return { allowed: false, reason: 'status' };
  }

  const hhmm = normalizeTimeHHMM(slotStart) || '00:00';
  const slotIso = `${bookingDate}T${hhmm}:00+05:00`;
  const slotMs = Date.parse(slotIso);
  if (Number.isNaN(slotMs)) {
    return { allowed: false, reason: 'too_late' };
  }

  const threeHoursMs = 3 * 60 * 60 * 1000;
  if (slotMs - Date.now() < threeHoursMs) {
    return { allowed: false, reason: 'too_late' };
  }

  return { allowed: true };
}

export function getBookingStatusBadgeVariant(status: BookingStatus): BadgeVariant {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
    case 'completed':
      return 'success';
    case 'rescheduled':
    case 'in_progress':
      return 'orange';
    case 'cancelled':
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}
