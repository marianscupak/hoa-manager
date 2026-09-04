import { TZDate } from '@date-fns/tz';

/**
 * Calendar dates typed by users (e.g. the effective date of an ownership
 * transfer) are interpreted in this zone. A single constant for now; a
 * per-association setting can replace it without touching call sites.
 */
export const ASSOCIATION_TIME_ZONE = 'Europe/Prague';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses `YYYY-MM-DD` into the instant of local midnight in the association
 * time zone. Returns null for malformed strings and impossible dates such as
 * 2026-02-30 (which the Date constructor would silently roll over).
 */
export function parseAssociationDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const zoned = new TZDate(year, month - 1, day, ASSOCIATION_TIME_ZONE);
  if (
    zoned.getFullYear() !== year ||
    zoned.getMonth() !== month - 1 ||
    zoned.getDate() !== day
  ) {
    return null;
  }
  return new Date(zoned.getTime());
}

/** The `YYYY-MM-DD` calendar day an instant falls on in the association zone. */
export function formatAssociationDate(instant: Date): string {
  const zoned = new TZDate(instant.getTime(), ASSOCIATION_TIME_ZONE);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`;
}
