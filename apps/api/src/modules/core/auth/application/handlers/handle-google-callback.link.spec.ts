import { HandleGoogleCallbackCommand } from '@/modules/core/auth/application/commands/handle-google-callback.command';

import { HandleGoogleCallbackHandler } from './handle-google-callback.handler';

const NOW = new Date('2026-09-17T10:00:00Z');
const ACCOUNT = { id: 'u1', email: 'marian@example.com', isActive: true };

function buildHandler(overrides?: {
  purpose?: 'LOGIN' | 'LINK';
  attemptUserId?: string | null;
  googleEmail?: string;
  emailVerified?: boolean;
  identityOwnerId?: string | null;
}) {
  const attempt = {
    id: 'a1',
    provider: 'OIDC_GOOGLE' as const,
    purpose: overrides?.purpose ?? 'LINK',
    userId:
      overrides?.attemptUserId === undefined ? 'u1' : overrides.attemptUserId,
    stateHash: 'hash',
    nonce: 'nonce',
    expiresAt: new Date('2026-09-17T10:05:00Z'),
    createdAt: NOW,
  };
  const authIdentityRepository = {
    findByProvider: jest
      .fn()
      .mockResolvedValue(
        overrides?.identityOwnerId
          ? { id: 'i9', userId: overrides.identityOwnerId }
          : null,
      ),
    create: jest.fn().mockResolvedValue({ id: 'i1' }),
    updateLastUsed: jest.fn(),
    listByUser: jest.fn(),
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
        email: overrides?.googleEmail ?? 'marian@example.com',
        email_verified: overrides?.emailVerified ?? true,
        name: 'Marian',
      },
    }),
  };
  const queryBus = { execute: jest.fn().mockResolvedValue(ACCOUNT) };
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
  return { handler, authIdentityRepository, authSessionRepository };
}

const run = (h: HandleGoogleCallbackHandler) =>
  h.execute(
    new HandleGoogleCallbackCommand({ code: 'code', state: 'state' } as never),
  );

describe('HandleGoogleCallbackHandler — linking', () => {
  it('attaches Google to the account the attempt belongs to', async () => {
    const { handler, authIdentityRepository, authSessionRepository } =
      buildHandler();

    await run(handler);

    expect(authIdentityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        provider: 'OIDC_GOOGLE',
        providerSubject: 'google-sub-1',
      }),
    );
    // Linking is not a sign-in: the caller already holds a session.
    expect(authSessionRepository.create).not.toHaveBeenCalled();
  });

  it('refuses a Google address that is not the account’s', async () => {
    const { handler, authIdentityRepository } = buildHandler({
      googleEmail: 'someone.else@example.com',
    });

    await expect(run(handler)).rejects.toMatchObject({
      code: 'IDENTITY_EMAIL_MISMATCH',
    });
    expect(authIdentityRepository.create).not.toHaveBeenCalled();
  });

  it('refuses a Google account that already stands for somebody else', async () => {
    const { handler, authIdentityRepository } = buildHandler({
      identityOwnerId: 'u2',
    });

    await expect(run(handler)).rejects.toMatchObject({
      code: 'IDENTITY_ALREADY_LINKED',
    });
    expect(authIdentityRepository.create).not.toHaveBeenCalled();
  });

  it('accepts a repeat of the same link without creating a second one', async () => {
    const { handler, authIdentityRepository } = buildHandler({
      identityOwnerId: 'u1',
    });

    await run(handler);

    expect(authIdentityRepository.create).not.toHaveBeenCalled();
  });

  it('refuses a link attempt that carries no account', async () => {
    // Belt and braces: `purpose` and `userId` are written together, so this
    // can only mean the row was tampered with.
    const { handler } = buildHandler({ attemptUserId: null });

    await expect(run(handler)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
