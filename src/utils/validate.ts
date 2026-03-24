const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeText(value: unknown, maxLength = 200): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function isStrongPassword(value: string): boolean {
  if (value.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  return hasLetter && hasNumber;
}
