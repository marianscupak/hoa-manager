import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { RegisterFromInviteCommand } from '@/modules/core/property/application/commands/register-from-invite.command';

import { RegisterFromInviteHandler } from './register-from-invite.handler';

const NOW = new Date('2026-09-17T10:00:00Z');

function build() {
  const invite = {
    id: 'inv1',
    tenantId: 't1',
    ownerId: 'o1',
    emailNormalized: 'marian@example.com',
    acceptedAt: null,
    expiresAt: new Date('2026-09-20T10:00:00Z'),
  };
  const inviteRepo = {
    findByTokenHash: jest.fn().mockResolvedValue(invite),
    markAccepted: jest.fn(),
  };
  const commandBus = {
    execute: jest.fn().mockImplementation((c: unknown) => {
      if (c instanceof CreateUserCommand) return Promise.resolve({ id: 'u1' });
      return Promise.resolve({ id: 'm1' });
    }),
  };
  const queryBus = {
    execute: jest
      .fn()
      .mockImplementation((q: { constructor: { name: string } }) =>
        q.constructor.name === 'GetUserByEmailQuery'
          ? null
          : { id: 'o1', displayName: 'Marian', userId: null },
      ),
  };
  const handler = new RegisterFromInviteHandler(
    { execute: jest.fn((fn: () => Promise<unknown>) => fn()) } as never,
    inviteRepo as never,
    { hash: jest.fn().mockResolvedValue('hashed') } as never,
    { now: () => NOW } as never,
    commandBus as never,
    queryBus as never,
    { set: jest.fn() } as never,
    { append: jest.fn() } as never,
    { requireActor: jest.fn().mockReturnValue({ type: 'USER' }) } as never,
    {
      resolveOwnerLabel: jest.fn().mockResolvedValue('Marian'),
      resolveUserLabel: jest.fn().mockResolvedValue('Marian'),
    } as never,
  );
  return { handler, commandBus };
}

describe('RegisterFromInviteHandler', () => {
  it('creates the account already verified — the token was delivered to that address', async () => {
    const { handler, commandBus } = build();

    await handler.execute(
      new RegisterFromInviteCommand('raw-token', 'secret123'),
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'marian@example.com',
        isEmailVerified: true,
      }),
    );
  });
});
