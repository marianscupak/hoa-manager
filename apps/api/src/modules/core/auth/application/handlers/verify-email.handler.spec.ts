import { VerifyEmailCommand } from '@/modules/core/auth/application/commands/verify-email.command';
import { hashToken } from '@/shared/application/utils/token.utils';

import { VerifyEmailHandler } from './verify-email.handler';

const NOW = new Date('2026-09-17T10:00:00Z');
const USER = {
  id: 'u1',
  email: 'marian@example.com',
  fullName: 'Marian',
  preferredLanguage: 'cs',
  isActive: true,
  isEmailVerified: false,
};

function build(codeRow: unknown) {
  const codeRepo = {
    findActiveByUser: jest.fn().mockResolvedValue(codeRow),
    incrementAttempts: jest.fn(),
    markConsumed: jest.fn(),
    create: jest.fn(),
    consumeAllForUser: jest.fn(),
  };
  const queryBus = {
    execute: jest
      .fn()
      .mockImplementation((q: { constructor: { name: string } }) =>
        q.constructor.name === 'GetMembershipsByUserIdQuery' ? [] : USER,
      ),
  };
  const commandBus = { execute: jest.fn() };
  const authSessionService = {
    createSession: jest
      .fn()
      .mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
  };
  const uow = { execute: jest.fn((fn: () => Promise<unknown>) => fn()) };

  const handler = new VerifyEmailHandler(
    uow as never,
    codeRepo as never,
    authSessionService as never,
    { now: () => NOW } as never,
    queryBus as never,
    commandBus as never,
  );
  return { handler, codeRepo, commandBus, authSessionService };
}

const liveRow = {
  id: 'c1',
  userId: 'u1',
  codeHash: hashToken('123456'),
  expiresAt: new Date('2026-09-17T10:10:00Z'),
  attempts: 0,
  consumedAt: null,
  createdAt: NOW,
};

const run = (h: VerifyEmailHandler, code = '123456') =>
  h.execute(new VerifyEmailCommand('marian@example.com', code));

describe('VerifyEmailHandler', () => {
  it('consumes the code, marks the address verified and issues a session', async () => {
    const { handler, codeRepo, commandBus, authSessionService } =
      build(liveRow);

    const result = await run(handler);

    expect(codeRepo.markConsumed).toHaveBeenCalledWith('c1', NOW);
    expect(commandBus.execute).toHaveBeenCalled();
    expect(authSessionService.createSession).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('counts a wrong code against the ceiling and refuses', async () => {
    const { handler, codeRepo } = build(liveRow);

    await expect(run(handler, '999999')).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_CODE',
    });

    expect(codeRepo.incrementAttempts).toHaveBeenCalledWith('c1');
    expect(codeRepo.markConsumed).not.toHaveBeenCalled();
  });

  it('refuses when there is no live code at all', async () => {
    const { handler } = build(null);

    await expect(run(handler)).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_CODE',
    });
  });

  it('refuses an expired code without consuming it', async () => {
    const { handler, codeRepo } = build({
      ...liveRow,
      expiresAt: new Date('2026-09-17T09:00:00Z'),
    });

    await expect(run(handler)).rejects.toMatchObject({
      code: 'INVALID_VERIFICATION_CODE',
    });

    expect(codeRepo.markConsumed).not.toHaveBeenCalled();
  });
});
