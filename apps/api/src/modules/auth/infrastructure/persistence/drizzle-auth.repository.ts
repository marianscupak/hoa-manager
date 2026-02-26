import { Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';

import { DrizzleService } from '../../../../infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '../../../../infrastructure/db/drizzle.unit-of-work';
import {
  authIdentities,
  authSessions,
} from '../../../../infrastructure/db/schema';
import {
  AuthIdentityRepository,
  AuthSessionRepository,
} from '../../application/ports/auth.repository.port';
import { AuthIdentity, AuthSession } from '../../domain/auth-identity.entity';

@Injectable()
export class DrizzleAuthIdentityRepository implements AuthIdentityRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async findByProvider(
    provider: 'LOCAL' | 'OIDC_GOOGLE',
    subject: string,
  ): Promise<AuthIdentity | null> {
    const row = await this.db.query.authIdentities.findFirst({
      where: and(
        eq(authIdentities.provider, provider),
        eq(authIdentities.providerSubject, subject),
      ),
    });
    return row ?? null;
  }

  async create(
    identity: Omit<AuthIdentity, 'id' | 'createdAt' | 'lastUsedAt'>,
  ): Promise<AuthIdentity> {
    const [inserted] = await this.db
      .insert(authIdentities)
      .values({
        userId: identity.userId,
        provider: identity.provider,
        providerSubject: identity.providerSubject,
        passwordHash: identity.passwordHash,
      })
      .returning();
    return inserted;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db
      .update(authIdentities)
      .set({ lastUsedAt: new Date() })
      .where(eq(authIdentities.id, id));
  }
}

@Injectable()
export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async findByHash(hash: string): Promise<AuthSession | null> {
    const row = await this.db.query.authSessions.findFirst({
      where: eq(authSessions.refreshTokenHash, hash),
    });
    return row ?? null;
  }

  async create(
    session: Omit<AuthSession, 'id' | 'createdAt' | 'lastUsedAt' | 'revokedAt'>,
  ): Promise<AuthSession> {
    const [inserted] = await this.db
      .insert(authSessions)
      .values({
        userId: session.userId,
        refreshTokenHash: session.refreshTokenHash,
        rotatedFromSessionId: session.rotatedFromSessionId,
        expiresAt: session.expiresAt,
      })
      .returning();
    return inserted;
  }

  async markRevoked(id: string): Promise<void> {
    await this.db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.id, id));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)),
      );
  }
}
