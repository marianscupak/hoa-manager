import { hashToken } from '@/shared/application/utils/token.utils';

import {
  decideEmailVerification,
  generateVerificationCode,
  MAX_VERIFICATION_ATTEMPTS,
  type StoredVerificationCode,
} from './verify-email-code';

const NOW = new Date('2026-09-17T10:00:00Z');

const stored = (
  o: Partial<StoredVerificationCode> = {},
): StoredVerificationCode => ({
  codeHash: hashToken('123456'),
  expiresAt: new Date('2026-09-17T10:10:00Z'),
  attempts: 0,
  consumedAt: null,
  ...o,
});

describe('decideEmailVerification', () => {
  it('accepts the code it was issued for', () => {
    expect(
      decideEmailVerification({ code: '123456', stored: stored(), now: NOW }),
    ).toEqual({ outcome: 'OK' });
  });

  it('refuses a code that does not match', () => {
    expect(
      decideEmailVerification({ code: '999999', stored: stored(), now: NOW }),
    ).toEqual({ outcome: 'REFUSE', reason: 'MISMATCH' });
  });

  it('refuses a consumed code even when it matches', () => {
    expect(
      decideEmailVerification({
        code: '123456',
        stored: stored({ consumedAt: NOW }),
        now: NOW,
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'CONSUMED' });
  });

  it('refuses an expired code even when it matches', () => {
    expect(
      decideEmailVerification({
        code: '123456',
        stored: stored({ expiresAt: new Date('2026-09-17T09:59:59Z') }),
        now: NOW,
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'EXPIRED' });
  });

  it('refuses once the attempt ceiling is reached, before comparing the hash', () => {
    expect(
      decideEmailVerification({
        code: '123456',
        stored: stored({ attempts: MAX_VERIFICATION_ATTEMPTS }),
        now: NOW,
      }),
    ).toEqual({ outcome: 'REFUSE', reason: 'TOO_MANY_ATTEMPTS' });
  });
});

describe('generateVerificationCode', () => {
  it('is always six digits, leading zeros kept', () => {
    for (let i = 0; i < 500; i++) {
      expect(generateVerificationCode()).toMatch(/^\d{6}$/);
    }
  });
});
