import { ListOwnersQuery } from '@/modules/core/property/application/queries/list-owners.query';

import { ListOwnersHandler } from './list-owners.handler';

const TENANT = 't1';
const NOW = new Date('2026-08-31T10:00:00Z');

function buildHandler(overrides?: {
  owners?: unknown[];
  invite?: { expiresAt: Date; createdAt: Date } | null;
  referenced?: string[];
}) {
  const owners = overrides?.owners ?? [
    {
      id: 'o1',
      tenantId: TENANT,
      displayName: 'Jana Nováková',
      email: 'jana@example.com',
      userId: null,
      kind: 'PERSON',
      katastrPersonId: 'k-person-1',
      ico: '250830',
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
  const ownerRepo = { listByTenant: jest.fn().mockResolvedValue(owners) };
  const queryBus = {
    execute: jest.fn().mockResolvedValue(overrides?.invite ?? null),
  };
  const clock = { now: () => NOW };
  const ownershipRepo = {
    listReferencedOwnerIds: jest
      .fn()
      .mockResolvedValue(new Set(overrides?.referenced ?? [])),
  };
  const handler = new ListOwnersHandler(
    ownerRepo as never,
    queryBus as never,
    clock as never,
    ownershipRepo as never,
  );
  return { handler, queryBus };
}

describe('ListOwnersHandler', () => {
  it('returns pending status with the invite creation date', async () => {
    const createdAt = new Date('2026-08-19T10:00:00Z');
    const { handler } = buildHandler({
      invite: { expiresAt: new Date('2026-09-10T10:00:00Z'), createdAt },
    });

    const [owner] = await handler.execute(new ListOwnersQuery(TENANT));

    expect(owner.inviteStatus).toBe('pending');
    expect(owner.inviteCreatedAt).toEqual(createdAt);
  });

  it('returns expired status when the invite expiry is in the past', async () => {
    const createdAt = new Date('2026-07-01T10:00:00Z');
    const { handler } = buildHandler({
      invite: { expiresAt: new Date('2026-07-15T10:00:00Z'), createdAt },
    });

    const [owner] = await handler.execute(new ListOwnersQuery(TENANT));

    expect(owner.inviteStatus).toBe('expired');
    expect(owner.inviteCreatedAt).toEqual(createdAt);
  });

  it('skips the invite lookup for linked owners', async () => {
    const { handler, queryBus } = buildHandler({
      owners: [
        {
          id: 'o2',
          tenantId: TENANT,
          displayName: 'Marek Dvořák',
          email: 'marek@example.com',
          userId: 'u1',
          kind: 'PERSON',
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    });

    const [owner] = await handler.execute(new ListOwnersQuery(TENANT));

    expect(owner.inviteStatus).toBeNull();
    expect(owner.inviteCreatedAt).toBeNull();
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('flags owners that appear in any ownership period', async () => {
    const { handler } = buildHandler({ referenced: ['o1'] });

    const [owner] = await handler.execute(new ListOwnersQuery(TENANT));

    expect(owner.hasOwnershipRecords).toBe(true);
  });

  it('leaves never-assigned owners deletable', async () => {
    const { handler } = buildHandler({ referenced: [] });

    const [owner] = await handler.execute(new ListOwnersQuery(TENANT));

    expect(owner.hasOwnershipRecords).toBe(false);
  });

  it('exposes ico but never the cadastre person id', async () => {
    const { handler } = buildHandler();

    const [owner] = await handler.execute(new ListOwnersQuery(TENANT));

    expect(owner.ico).toBe('250830');
    expect(owner).not.toHaveProperty('katastrPersonId');
  });
});
