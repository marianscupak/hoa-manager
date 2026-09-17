import { RegisterAccountCommand } from '@/modules/core/auth/application/commands/register-account.command';

import { RegisterAccountHandler } from './register-account.handler';

// The real renderer needs ESM, which Jest is not running. What the template
// says is asserted in @hoa-mngr/emails; here only the choice of mail matters.
jest.mock('@hoa-mngr/emails', () => ({
  renderAccountExistsEmail: jest
    .fn()
    .mockResolvedValue({ subject: 's', html: 'h', text: 't' }),
}));

const NOW = new Date('2026-09-17T10:00:00Z');

function build(existingUser: unknown = null, identity: unknown = null) {
  const queryBus = { execute: jest.fn().mockResolvedValue(existingUser) };
  const commandBus = {
    execute: jest.fn().mockResolvedValue({ id: 'new-user' }),
  };
  const authIdentityRepository = {
    findByProvider: jest.fn().mockResolvedValue(identity),
    updatePassword: jest.fn(),
    create: jest.fn(),
    listByUser: jest.fn(),
    updateLastUsed: jest.fn(),
    deleteByUserAndProvider: jest.fn(),
  };
  const verificationCodes = { issueAndSend: jest.fn() };
  const emailSender = { send: jest.fn() };
  const passwordHasher = { hash: jest.fn().mockResolvedValue('hashed') };
  const uow = { execute: jest.fn((fn: () => Promise<unknown>) => fn()) };
  const configService = { get: jest.fn().mockReturnValue('https://app.test') };

  const handler = new RegisterAccountHandler(
    uow as never,
    authIdentityRepository as never,
    passwordHasher as never,
    verificationCodes as never,
    emailSender as never,
    { now: () => NOW } as never,
    configService as never,
    queryBus as never,
    commandBus as never,
  );

  return {
    handler,
    commandBus,
    authIdentityRepository,
    verificationCodes,
    emailSender,
  };
}

const run = (h: RegisterAccountHandler) =>
  h.execute(
    new RegisterAccountCommand('Marian@Example.com', 'Marian', 'secret123'),
  );

describe('RegisterAccountHandler', () => {
  it('creates an unverified account and sends a code when the address is free', async () => {
    const { handler, commandBus, verificationCodes } = build(null);

    await run(handler);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'marian@example.com',
        fullName: 'Marian',
        isEmailVerified: false,
      }),
    );
    expect(verificationCodes.issueAndSend).toHaveBeenCalledWith(
      'new-user',
      'marian@example.com',
    );
  });

  it('overwrites the password and re-sends a code for an unverified account', async () => {
    const { handler, authIdentityRepository, verificationCodes } = build(
      { id: 'u1', email: 'marian@example.com', isEmailVerified: false },
      { id: 'i1', userId: 'u1' },
    );

    await run(handler);

    expect(authIdentityRepository.updatePassword).toHaveBeenCalledWith(
      'i1',
      'hashed',
    );
    expect(verificationCodes.issueAndSend).toHaveBeenCalledWith(
      'u1',
      'marian@example.com',
    );
  });

  it('writes nothing and sends the account-exists mail for a verified account', async () => {
    const { handler, authIdentityRepository, verificationCodes, emailSender } =
      build(
        { id: 'u1', email: 'marian@example.com', isEmailVerified: true },
        { id: 'i1', userId: 'u1' },
      );

    await run(handler);

    expect(authIdentityRepository.updatePassword).not.toHaveBeenCalled();
    expect(verificationCodes.issueAndSend).not.toHaveBeenCalled();
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'marian@example.com' }),
    );
  });

  it('never throws, whatever the state of the address', async () => {
    for (const user of [
      null,
      { id: 'u1', email: 'marian@example.com', isEmailVerified: false },
      { id: 'u1', email: 'marian@example.com', isEmailVerified: true },
    ]) {
      const { handler } = build(user, user ? { id: 'i1', userId: 'u1' } : null);
      await expect(run(handler)).resolves.toBeUndefined();
    }
  });
});
