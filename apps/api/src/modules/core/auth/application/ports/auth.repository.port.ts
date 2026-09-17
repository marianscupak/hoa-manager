import {
  AuthIdentity,
  AuthSession,
} from '@/modules/core/auth/domain/auth-identity.entity';

export interface AuthIdentityRepository {
  findByProvider(
    provider: string,
    subject: string,
  ): Promise<AuthIdentity | null>;
  /** Every way the account can sign in, for the profile and the last-one guard. */
  listByUser(userId: string): Promise<AuthIdentity[]>;
  create(
    identity: Omit<AuthIdentity, 'id' | 'createdAt' | 'lastUsedAt'>,
  ): Promise<AuthIdentity>;
  /** Replaces the password of a LOCAL identity — the re-registration path. */
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateLastUsed(id: string): Promise<void>;
  deleteByUserAndProvider(userId: string, provider: string): Promise<void>;
}

export const AUTH_IDENTITY_REPOSITORY = Symbol('AUTH_IDENTITY_REPOSITORY');

export interface AuthSessionRepository {
  findByHash(hash: string): Promise<AuthSession | null>;
  create(
    session: Omit<AuthSession, 'id' | 'createdAt' | 'lastUsedAt' | 'revokedAt'>,
  ): Promise<AuthSession>;
  markRevoked(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  /** Drops sessions already past `expiresAt`; returns how many went. */
  deleteExpired(cutoff: Date): Promise<number>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

export interface OidcLoginAttempt {
  id: string;
  provider: 'LOCAL' | 'OIDC_GOOGLE';
  /**
   * `LOGIN` signs in or registers; `LINK` attaches the provider to the
   * account in `userId` and may do nothing else. Kept apart so a link
   * round trip cannot be replayed into the sign-in branch.
   */
  purpose: 'LOGIN' | 'LINK';
  /** The account a `LINK` attempt belongs to; null for `LOGIN`. */
  userId: string | null;
  stateHash: string;
  nonce: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OidcLoginAttemptRepository {
  create(
    attempt: Omit<OidcLoginAttempt, 'id' | 'createdAt'>,
  ): Promise<OidcLoginAttempt>;
  findByStateHash(stateHash: string): Promise<OidcLoginAttempt | null>;
  delete(id: string): Promise<void>;
}

export const OIDC_LOGIN_ATTEMPT_REPOSITORY = Symbol(
  'OIDC_LOGIN_ATTEMPT_REPOSITORY',
);

export interface AuthExchangeCode {
  id: string;
  codeHash: string;
  userId: string;
  tenantId: string | null;
  membershipId: string | null;
  roles: string[] | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface AuthExchangeCodeRepository {
  create(
    code: Omit<AuthExchangeCode, 'id' | 'createdAt' | 'usedAt'>,
  ): Promise<AuthExchangeCode>;
  findByCodeHash(codeHash: string): Promise<AuthExchangeCode | null>;
  markUsed(id: string): Promise<void>;
}

export const AUTH_EXCHANGE_CODE_REPOSITORY = Symbol(
  'AUTH_EXCHANGE_CODE_REPOSITORY',
);

export interface EmailVerificationCode {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface EmailVerificationCodeRepository {
  create(
    code: Omit<
      EmailVerificationCode,
      'id' | 'createdAt' | 'attempts' | 'consumedAt'
    >,
  ): Promise<EmailVerificationCode>;
  /** The newest code for the user that has not been consumed yet. */
  findActiveByUser(userId: string): Promise<EmailVerificationCode | null>;
  /** Issuing a new code retires every earlier one, so only one is ever live. */
  consumeAllForUser(userId: string, at: Date): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
  markConsumed(id: string, at: Date): Promise<void>;
}

export const EMAIL_VERIFICATION_CODE_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_CODE_REPOSITORY',
);
