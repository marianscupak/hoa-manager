export type InviteStatus = 'valid' | 'expired' | 'accepted' | 'not_found';

export const InviteStatus = {
  VALID: 'valid',
  EXPIRED: 'expired',
  ACCEPTED: 'accepted',
  NOT_FOUND: 'not_found',
} as const;
