/**
 * Normalizes an email address for consistent comparison and storage.
 * Applies trim + lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
