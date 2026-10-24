import { getLocalized } from '../i18n/helpers';
import { buildWhatsAppUrl as originalBuildWhatsAppUrl } from './whatsapp';
import type { LocalizedText } from '../types/database';

export function formatPKR(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (!Number.isFinite(num)) return 'Rs. 0';
  return `Rs. ${Math.round(num).toLocaleString('en-PK')}`;
}

export function formatPKRPrice(amount: number | string | null | undefined): string {
  return formatPKR(amount);
}

export function formatKarachiDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return iso;
  }
}

export function pickLocalized(
  text: LocalizedText | string | null | undefined,
  lang?: string
): string {
  return getLocalized(text, lang);
}

export function buildTelUrl(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return `tel:${cleaned}`;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  return originalBuildWhatsAppUrl(phone, message);
}
