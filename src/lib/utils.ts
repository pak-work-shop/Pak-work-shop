import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export { buildWhatsAppUrl } from './whatsapp';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

/**
 * Formats a numeric PKR amount as e.g. "Rs. 4,500"
 */
export function formatPKR(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (Number.isNaN(num)) return 'Rs. 0';
  const rounded = Math.round(num * 100) / 100;
  const hasDecimals = rounded % 1 !== 0;
  return `Rs. ${rounded.toLocaleString('en-PK', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a date or timestamp in Asia/Karachi timezone for the active language.
 */
export function formatPKDate(
  value: string | Date | null | undefined,
  language: string = 'en'
): string {
  if (!value) return '—';
  try {
    const dt =
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00+05:00`)
        : new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    const locale = language === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Karachi',
      dateStyle: 'medium',
    }).format(dt);
  } catch {
    return String(value);
  }
}

/**
 * Formats a timestamp in Asia/Karachi timezone with date + time.
 */
export function formatPKDateTime(
  value: string | Date | null | undefined,
  language: string = 'en'
): string {
  if (!value) return '—';
  try {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    const locale = language === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Karachi',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(dt);
  } catch {
    return String(value);
  }
}

/**
 * Client-side fallback plate masker matching public.mask_plate_number(p_plate)
 * e.g. "LEA-21-4589" -> "LEA-••-4589"
 */
export function maskPlateClient(plate: string | null | undefined): string {
  const clean = (plate ?? '').trim().toUpperCase();
  if (!clean) return '—';
  const parts = clean.split('-');
  if (parts.length >= 3) {
    return `${parts[0]}-••-${parts[parts.length - 1]}`;
  }
  if (parts.length === 2) {
    const tail = parts[1];
    return tail.length > 2
      ? `${parts[0]}-••${tail.slice(-2)}`
      : `${parts[0]}-••`;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 1)}••${clean.slice(-1)}`;
  }
  return `${clean.slice(0, 2)}••${clean.slice(-2)}`;
}

/**
 * Detects Postgres / PostgREST errors indicating that a table, column, or RPC
 * from the latest SQL file has not been executed yet in Supabase.
 */
export function isPhaseSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string };
  const code = String(err.code ?? '').toUpperCase();
  const msg = `${err.message ?? ''} ${err.details ?? ''}`.toLowerCase();

  if (
    code === '42P01' ||
    code === '42703' ||
    code === '42883' ||
    code === 'PGRST202' ||
    code === 'PGRST204' ||
    code === 'PGRST205'
  ) {
    return true;
  }

  return (
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the function') ||
    msg.includes('schema cache')
  );
}

