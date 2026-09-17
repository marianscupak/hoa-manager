import { HandleGoogleCallbackCommand } from '@/modules/core/auth/application/commands/handle-google-callback.command';

import { HandleGoogleCallbackHandler } from './handle-google-callback.handler';

const NOW = new Date('2026-09-17T10:00:00Z');

function buildSignIn(existingByEmail: unknown) {
  const attempt = {
    id: 'a1',
    provider: 'OIDC_GOOGLE' as const,
    purpose: 'LOGIN' as const,
    userId: null,
    stateHash: 'hash',
    nonce: 'nonce',
    expiresAt: new Date('2026-09-17T10:05:00Z'),
    createdAt: NOW,
  };
  const authIdentityRepository = {
    // No Google identity exists for this subject yet.
    findByProvider: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'i1', userId: 'u1' }),
    updateLastUsed: jest.fn(),
    listByUser: jest.fn(),
    updatePassword: jest.fn(),
    deleteByUserAndProvider: jest.fn(),
  };
  const attemptRepository = {
    findByStateHash: jest.fn().mockResolvedValue(attempt),
    delete: jest.fn(),
    create: jest.fn(),
  };
  const googleOidcService = {
    exchangeCode: jest.fn().mockResolvedValue({
      idTokenPayload: {
        sub: 'google-sub-1',
        email: 'marian@example.com',
        email_verified: true,
        name: 'Marian',
      },
    }),
  };
  const queryBus = {
    execute: jest
      .fn()
      .mockImplementation((q: { constructor: { name: string } }) => {
        if (q.constructor.name === 'GetMembershipsByUserIdQuery') return [];
        return existingByEmail;
      }),
  };
  const commandBus = { execute: jest.fn() };
  const authSessionRepository = { create: jest.fn() };
  const exchangeCodeRepository = { create: jest.fn() };
  const uow = { execute: jest.fn((fn: () => Promise<unknown>) => fn()) };
  const configService = { get: jest.fn().mockReturnValue('https://app.test') };

  const handler = new HandleGoogleCallbackHandler(
    uow as never,
    authIdentityRepository as never,
    authSessionRepository as never,
    attemptRepository as never,
    exchangeCodeRepository as never,
    googleOidcService as never,
    { now: () => NOW } as never,
    configService as never,
    queryBus as never,
    commandBus as never,
  );
  return { handler, authIdentityRepository, commandBus };
}

const run = (h: HandleGoogleCallbackHandler) =>
  h.execute(
    new HandleGoogleCallbackCommand({ code: 'code', state: 'state' } as never),
  );

describe('HandleGoogleCallbackHandler — signing in', () => {
  it('attaches Google to an account that already proved this address', async () => {
    const { handler, authIdentityRepository } = buildSignIn({
      id: 'u1',
      email: 'marian@example.com',
      fullName: 'Marian',
      preferredLanguage: 'cs',
      isActive: true,
      isEmailVerified: true,
    });

    await run(handler);

    expect(authIdentityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        provider: 'OIDC_GOOGLE',
        providerSubject: 'google-sub-1',
      }),
    );
  });

  it('refuses an account that never proved its address', async () => {
    const { handler } = buildSignIn({
      id: 'u1',
      email: 'marian@example.com',
      fullName: 'Marian',
      preferredLanguage: 'cs',
      isActive: true,
      isEmailVerified: false,
    });

    await expect(run(handler)).rejects.toMatchObject({
      code: 'ACCOUNT_EXISTS',
    });
  });
});
