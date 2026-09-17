import { LoginCommand } from '@/modules/core/auth/application/commands/login.command';

import { LoginHandler } from './login.handler';

const NOW = new Date('2026-09-17T10:00:00Z');

function build(user: { isEmailVerified: boolean }, passwordValid = true) {
  const queryBus = {
    execute: jest
      .fn()
      .mockImplementation((q: { constructor: { name: string } }) =>
        q.constructor.name === 'GetMembershipsByUserIdQuery'
          ? []
          : {
              id: 'u1',
              email: 'marian@example.com',
              fullName: 'Marian',
              preferredLanguage: 'cs',
              isActive: true,
              ...user,
            },
      ),
  };
  const authIdentityRepository = {
    findByProvider: jest
      .fn()
      .mockResolvedValue({ id: 'i1', userId: 'u1', passwordHash: 'hash' }),
    updateLastUsed: jest.fn(),
    create: jest.fn(),
    listByUser: jest.fn(),
    updatePassword: jest.fn(),
    deleteByUserAndProvider: jest.fn(),
  };
  const passwordHasher = {
    compare: jest.fn().mockResolvedValue(passwordValid),
    compareDummy: jest.fn(),
    hash: jest.fn(),
  };
  const handler = new LoginHandler(
    { execute: jest.fn((fn: () => Promise<unknown>) => fn()) } as never,
    authIdentityRepository as never,
    { create: jest.fn() } as never,
    passwordHasher as never,
    { signToken: jest.fn().mockResolvedValue('at') } as never,
    { now: () => NOW } as never,
    queryBus as never,
  );
  return { handler };
}

const run = (h: LoginHandler) =>
  h.execute(new LoginCommand('marian@example.com', 'LOCAL', 'secret123'));

describe('LoginHandler — unverified accounts', () => {
  it('refuses an account whose address was never proven', async () => {
    const { handler } = build({ isEmailVerified: false });

    await expect(run(handler)).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
  });

  it('answers a wrong password with INVALID_CREDENTIALS even when unverified', async () => {
    // The check must sit behind a correct password. In front of it, anyone
    // could learn which addresses have accounts, and their state, with no
    // credentials at all.
    const { handler } = build({ isEmailVerified: false }, false);

    await expect(run(handler)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('lets a verified account in', async () => {
    const { handler } = build({ isEmailVerified: true });

    await expect(run(handler)).resolves.toMatchObject({ accessToken: 'at' });
  });
});
