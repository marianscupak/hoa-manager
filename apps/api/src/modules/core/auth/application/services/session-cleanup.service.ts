import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

/**
 * Removes refresh-token sessions that can no longer do anything.
 *
 * The access token lives only in memory, so every page load exchanges the
 * refresh cookie and writes a new session row. Nothing ever removed the old
 * ones, leaving a table that grows with traffic forever.
 *
 * The cut-off is the row's own `expires_at` rather than an invented retention
 * window: `validateSessionStatus` rejects an expired session before it looks
 * at revocation, so a row past its expiry can no longer trigger replay
 * detection and deleting it costs no security signal.
 */
@Injectable()
export class SessionCleanupService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async removeDeadSessions(): Promise<void> {
    try {
      const count = await this.sessions.deleteExpired(this.clock.now());
      this.logger.info('ExpiredSessionsRemoved', { count });
    } catch (error) {
      // A failed sweep must not take the scheduler down with it; the next
      // run picks up whatever this one left behind.
      this.logger.error('ExpiredSessionsRemovalFailed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
