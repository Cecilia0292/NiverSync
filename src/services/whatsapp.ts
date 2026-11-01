/**
 * Normalizes phone numbers for WhatsApp wa.me links
 * Default country is Brazil (55) if standard DDD + phone is provided
 */
export function formatPhoneForWhatsApp(input: string): string {
  if (!input) return '';
  // Keep only digits
  let digits = input.replace(/\D/g, '');

  if (!digits) return '';

  // If number starts with 0, remove the leading 0
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If 10 or 11 digits (Brazilian DDD + number), add 55 country code
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  return digits;
}

/**
 * Creates a universal WhatsApp Web / App direct chat URL
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Validates whether string is a recognizable phone number
 */
export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}
