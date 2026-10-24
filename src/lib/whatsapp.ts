/**
 * Normalizes a Pakistani mobile/WhatsApp phone number into international format
 * without "+" or leading zeros, suitable for https://wa.me/<number>.
 * Example: "03126776844" -> "923126776844"
 * Example: "+92 312 6776844" -> "923126776844"
 */
export function formatPakistanWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) {
    return '923126776844';
  }
  if (digits.startsWith('0092') && digits.length >= 14) {
    return digits.slice(2);
  }
  if (digits.startsWith('92') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return `92${digits}`;
  }
  return digits;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const formattedNumber = formatPakistanWhatsAppNumber(phone);
  if (!message || !message.trim()) {
    return `https://wa.me/${formattedNumber}`;
  }
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message.trim())}`;
}
