import type { AuthSessionRepository } from '@/modules/core/auth/application/ports/auth.repository.port';
import { SessionCleanupService } from '@/modules/core/auth/application/services/session-cleanup.service';
import type { Clock } from '@/shared/application/ports/clock.port';

const NOW = new Date('2026-09-16T03:00:00Z');

function build() {
  const clock: Clock = { now: () => NOW };
  const deleteExpired = jest.fn(async () => 7);
  const repo = { deleteExpired } as unknown as AuthSessionRepository;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  return {
    service: new SessionCleanupService(repo, clock, logger as never),
    deleteExpired,
    logger,
  };
}

describe('SessionCleanupService', () => {
  it('removes sessions that are already past their expiry', async () => {
    // Every page load rotates the refresh token, so a row is written per
    // load and nothing ever removed them. A row past `expires_at` is checked
    // for expiry before replay detection ever runs, so deleting it gives up
    // no security signal.
    const { service, deleteExpired } = build();

    await service.removeDeadSessions();

    expect(deleteExpired).toHaveBeenCalledWith(NOW);
  });

  it('reports how many it removed', async () => {
    const { service, logger } = build();

    await service.removeDeadSessions();

    expect(logger.info).toHaveBeenCalledWith(
      'ExpiredSessionsRemoved',
      expect.objectContaining({ count: 7 }),
    );
  });

  it('does not let a failed sweep take the scheduler down', async () => {
    const { service, deleteExpired, logger } = build();
    deleteExpired.mockRejectedValueOnce(new Error('connection lost'));

    await expect(service.removeDeadSessions()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
