import { AuthIdentity, AuthSession } from '../../domain/auth-identity.entity';

export interface AuthIdentityRepository {
  findByProvider(
    provider: string,
    subject: string,
  ): Promise<AuthIdentity | null>;
  create(
    identity: Omit<AuthIdentity, 'id' | 'createdAt' | 'lastUsedAt'>,
  ): Promise<AuthIdentity>;
  updateLastUsed(id: string): Promise<void>;
}

export const AUTH_IDENTITY_REPOSITORY = Symbol('AUTH_IDENTITY_REPOSITORY');

export interface AuthSessionRepository {
  findByHash(hash: string): Promise<AuthSession | null>;
  create(
    session: Omit<AuthSession, 'id' | 'createdAt' | 'lastUsedAt' | 'revokedAt'>,
  ): Promise<AuthSession>;
  markRevoked(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

export interface OidcLoginAttempt {
  id: string;
  provider: 'LOCAL' | 'OIDC_GOOGLE';
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
