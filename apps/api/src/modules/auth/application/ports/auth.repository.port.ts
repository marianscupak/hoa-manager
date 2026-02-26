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
