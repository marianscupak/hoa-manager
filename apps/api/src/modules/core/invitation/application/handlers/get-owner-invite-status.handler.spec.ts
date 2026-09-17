import { GetOwnerInviteStatusQuery } from '@/modules/core/invitation/application/queries/get-owner-invite-status.query';

import { GetOwnerInviteStatusHandler } from './get-owner-invite-status.handler';

const NOW = new Date('2026-09-17T10:00:00Z');

function build(userForEmail: unknown) {
  const inviteRepo = {
    findByTokenHash: jest.fn().mockResolvedValue({
      id: 'inv1',
      tenantId: 't1',
      ownerId: 'o1',
      emailNormalized: 'marian@example.com',
      acceptedAt: null,
      expiresAt: new Date('2026-09-20T10:00:00Z'),
    }),
  };
  const queryBus = { execute: jest.fn().mockResolvedValue(userForEmail) };

  const handler = new GetOwnerInviteStatusHandler(
    inviteRepo as never,
    { now: () => NOW } as never,
    queryBus as never,
  );
  return { handler };
}

const run = (h: GetOwnerInviteStatusHandler) =>
  h.execute(new GetOwnerInviteStatusQuery('raw-token'));

describe('GetOwnerInviteStatusHandler', () => {
  it('says an account already exists for the invited address', async () => {
    const { handler } = build({ id: 'u1' });

    await expect(run(handler)).resolves.toMatchObject({
      status: 'valid',
      accountExists: true,
    });
  });

  it('says it does not when the address is free', async () => {
    const { handler } = build(null);

    await expect(run(handler)).resolves.toMatchObject({
      status: 'valid',
      accountExists: false,
    });
  });
});
