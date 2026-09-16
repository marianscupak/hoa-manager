import { createHash } from 'crypto';

import { QueryBus } from '@nestjs/cqrs';

import { RefreshTokenCommand } from '@/modules/core/auth/application/commands/refresh-token.command';
import { RefreshTokenHandler } from '@/modules/core/auth/application/handlers/refresh-token.handler';
import type { AuthSessionRepository } from '@/modules/core/auth/application/ports/auth.repository.port';
import type {
  TokenSigner,
  TokenVerifier,
} from '@/modules/core/auth/application/ports/auth.utils.port';
import type { AuthSession } from '@/modules/core/auth/domain/auth-identity.entity';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { GetMembershipsByUserIdQuery } from '@/modules/core/tenancy/application/queries/get-memberships-by-user-id.query';
import type { Clock } from '@/shared/application/ports/clock.port';
import type { UnitOfWork } from '@/shared/application/ports/unit-of-work.port';

const USER_ID = 'user-1';
const RAW_TOKEN = 'refresh-token-value';
const TOKEN_HASH = createHash('sha256').update(RAW_TOKEN).digest('hex');

/**
 * Stores sessions the way a transaction does: writes made inside a unit of
 * work are thrown away if the callback throws.
 *
 * A plain jest mock cannot show the bug this file exists for. `revokeAllForUser`
 * would be recorded as called either way; what matters is whether the write
 * still stands after the exception, and only something that actually rolls back
 * can tell the two apart.
 */
class TransactionalSessionStore {
  sessions = new Map<string, AuthSession>();
  private snapshot: Map<string, AuthSession> | null = null;

  begin(): void {
    this.snapshot = new Map(
      [...this.sessions].map(([id, s]) => [id, { ...s }]),
    );
  }
  commit(): void {
    this.snapshot = null;
  }
  rollback(): void {
    if (this.snapshot) this.sessions = this.snapshot;
    this.snapshot = null;
  }
}

function makeUnitOfWork(store: TransactionalSessionStore): UnitOfWork {
  return {
    async execute<T>(work: () => Promise<T>): Promise<T> {
      store.begin();
      try {
        const result = await work();
        store.commit();
        return result;
      } catch (error) {
        store.rollback();
        throw error;
      }
    },
  };
}

function makeSessionRepository(
  store: TransactionalSessionStore,
  clock: Clock,
): AuthSessionRepository {
  return {
    async findByHash(hash) {
      return (
        [...store.sessions.values()].find(
          (s) => s.refreshTokenHash === hash,
        ) ?? null
      );
    },
    async create(session) {
      const created: AuthSession = {
        ...session,
        id: `session-${store.sessions.size + 1}`,
        revokedAt: null,
        createdAt: clock.now(),
        lastUsedAt: null,
      };
      store.sessions.set(created.id, created);
      return created;
    },
    async markRevoked(id) {
      // Deliberately unguarded, exactly like the production repository: the
      // fix must live in the code under test, not in this double.
      const s = store.sessions.get(id);
      if (s) s.revokedAt = clock.now();
    },
    async revokeAllForUser(userId) {
      for (const s of store.sessions.values()) {
        if (s.userId === userId && !s.revokedAt) s.revokedAt = clock.now();
      }
    },
  };
}

function build(now: Date, session: Partial<AuthSession>) {
  const clock: Clock = { now: () => now };
  const store = new TransactionalSessionStore();
  store.sessions.set('session-1', {
    id: 'session-1',
    userId: USER_ID,
    refreshTokenHash: TOKEN_HASH,
    rotatedFromSessionId: null,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 86_400_000),
    createdAt: new Date(now.getTime() - 86_400_000),
    lastUsedAt: null,
    ...session,
  });

  const repo = makeSessionRepository(store, clock);
  const queryBus = {
    execute: jest.fn(async (query: unknown) => {
      if (query instanceof GetUserByIdQuery) {
        return {
          id: USER_ID,
          email: 'a@b.cz',
          fullName: 'A B',
          preferredLanguage: 'cs',
          isActive: true,
          isEmailVerified: true,
        };
      }
      if (query instanceof GetMembershipsByUserIdQuery) return [];
      return null;
    }),
  } as unknown as QueryBus;

  const handler = new RefreshTokenHandler(
    makeUnitOfWork(store),
    repo,
    queryBus,
    { signToken: async () => 'new-access-token' } as unknown as TokenSigner,
    { verifyToken: async () => null } as unknown as TokenVerifier,
    clock,
  );

  return { handler, store };
}

describe('RefreshTokenHandler', () => {
  const NOW = new Date('2026-09-16T12:00:00Z');

  it('keeps every session revoked after replay detection throws', async () => {
    // The whole point of revoking on replay is that it outlives the rejection.
    // Doing it inside the same transaction that then throws undid it.
    const revokedLongAgo = new Date(NOW.getTime() - 60_000);
    const { handler, store } = build(NOW, { revokedAt: revokedLongAgo });

    // The session the attacker replays is already revoked; what replay
    // detection must kill is the user's other, still-live session.
    store.sessions.set('session-live', {
      id: 'session-live',
      userId: USER_ID,
      refreshTokenHash: 'some-other-hash',
      rotatedFromSessionId: null,
      revokedAt: null,
      expiresAt: new Date(NOW.getTime() + 86_400_000),
      createdAt: new Date(NOW.getTime() - 3_600_000),
      lastUsedAt: null,
    });

    await expect(
      handler.execute(new RefreshTokenCommand(RAW_TOKEN, undefined)),
    ).rejects.toMatchObject({ code: 'REPLAY_ATTACK' });

    const live = [...store.sessions.values()].filter((s) => !s.revokedAt);
    expect(live).toHaveLength(0);
  });

  it('does not extend the reuse window when a token is reused inside it', async () => {
    // A sliding window could be held open forever by reusing every 20s.
    const revokedAt = new Date(NOW.getTime() - 20_000);
    const { handler, store } = build(NOW, { revokedAt });

    await handler.execute(new RefreshTokenCommand(RAW_TOKEN, undefined));

    expect(store.sessions.get('session-1')!.revokedAt).toEqual(revokedAt);
  });

  it('still revokes the old session on an ordinary rotation', async () => {
    const { handler, store } = build(NOW, {});

    const result = await handler.execute(
      new RefreshTokenCommand(RAW_TOKEN, undefined),
    );

    expect(store.sessions.get('session-1')!.revokedAt).toEqual(NOW);
    expect(result.refreshToken).not.toBe(RAW_TOKEN);
    expect([...store.sessions.values()].filter((s) => !s.revokedAt)).toHaveLength(
      1,
    );
  });
});
