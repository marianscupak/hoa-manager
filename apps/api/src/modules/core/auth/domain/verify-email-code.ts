import { randomInt } from 'node:crypto';

import { hashToken } from '@/shared/application/utils/token.utils';

/**
 * Whether a six-digit code proves the address it was sent to.
 *
 * The order of the checks is the design: a consumed, expired or exhausted row
 * is refused before the hash is compared, so a code that is no longer live
 * costs nothing to reject and cannot be ground down one guess at a time.
 */

export const MAX_VERIFICATION_ATTEMPTS = 5;
export const VERIFICATION_TTL_MINUTES = 15;

export interface StoredVerificationCode {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
}

export type VerificationRefusalReason =
  | 'CONSUMED'
  | 'EXPIRED'
  | 'TOO_MANY_ATTEMPTS'
  | 'MISMATCH';

export type EmailVerificationDecision =
  | { outcome: 'OK' }
  | { outcome: 'REFUSE'; reason: VerificationRefusalReason };

export function decideEmailVerification({
  code,
  stored,
  now,
}: {
  code: string;
  stored: StoredVerificationCode;
  now: Date;
}): EmailVerificationDecision {
  if (stored.consumedAt) {
    return { outcome: 'REFUSE', reason: 'CONSUMED' };
  }

  if (stored.expiresAt <= now) {
    return { outcome: 'REFUSE', reason: 'EXPIRED' };
  }

  if (stored.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    return { outcome: 'REFUSE', reason: 'TOO_MANY_ATTEMPTS' };
  }

  if (hashToken(code) !== stored.codeHash) {
    return { outcome: 'REFUSE', reason: 'MISMATCH' };
  }

  return { outcome: 'OK' };
}

/** Uniform over 000000–999999; `randomInt` avoids the modulo bias of `%`. */
export function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
