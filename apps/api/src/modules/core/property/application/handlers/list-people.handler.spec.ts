import { QueryBus } from '@nestjs/cqrs';

import { type PeopleHoldingsRepository } from '@/modules/core/property/application/ports/people-holdings.repository.port';
import { ListOwnersQuery } from '@/modules/core/property/application/queries/list-owners.query';
import { type Clock } from '@/shared/application/ports/clock.port';

import { ListPeopleHandler } from './list-people.handler';
import { ListPeopleQuery } from '../queries/list-people.query';

const NOW = new Date('2026-09-16T12:00:00Z');

const OWNERS = [
  {
    id: 'o1',
    tenantId: 't1',
    displayName: 'Jana Dvořáková',
    email: 'jana@hoa.local',
    userId: 'u1',
    kind: 'PERSON',
    ico: null,
    inviteStatus: null,
    inviteCreatedAt: null,
    hasOwnershipRecords: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const MEMBERS = [
  {
    id: 'm1',
    userId: 'u1',
    role: 'UNIT_OWNER',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    user: { id: 'u1', email: 'jana@hoa.local', fullName: 'Jana Dvořáková' },
  },
  {
    id: 'm9',
    userId: 'u9',
    role: 'BOARD_MEMBER',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    user: { id: 'u9', email: 'karel@hoa.local', fullName: 'Karel Malý' },
  },
];

function build() {
  const queryBus = {
    execute: jest.fn(async (query: unknown) =>
      query instanceof ListOwnersQuery ? OWNERS : MEMBERS,
    ),
  } as unknown as QueryBus;

  const holdings = {
    findHoldings: jest.fn(async () => [
      {
        ownerId: 'o1',
        unitId: 'unit-1',
        unitShareNum: 1,
        unitShareDen: 4,
        partyShareNum: 1,
        partyShareDen: 1,
      },
    ]),
  } as unknown as PeopleHoldingsRepository;

  return {
    handler: new ListPeopleHandler(queryBus, holdings, {
      now: () => NOW,
    } as Clock),
    holdings,
  };
}

describe('ListPeopleHandler', () => {
  it('reports the share as an exact percentage', async () => {
    const { handler } = build();

    const people = await handler.execute(new ListPeopleQuery('t1', true));
    const jana = people.find((p) => p.key === 'owner:o1')!;

    expect(jana.unitCount).toBe(1);
    expect(jana.sharePercent).toBe('25.00');
  });

  it('gives a privileged caller the account side', async () => {
    const { handler } = build();

    const people = await handler.execute(new ListPeopleQuery('t1', true));

    expect(people.find((p) => p.key === 'owner:o1')).toMatchObject({
      email: 'jana@hoa.local',
      role: 'UNIT_OWNER',
    });
    expect(people.map((p) => p.key)).toContain('member:m9');
  });

  it('withholds contact and account data from a unit owner', async () => {
    // Who owns which unit is public in the cadastre; an e-mail given to the
    // association to run the building is not.
    const { handler } = build();

    const people = await handler.execute(new ListPeopleQuery('t1', false));
    const jana = people.find((p) => p.key === 'owner:o1')!;

    expect(jana).toMatchObject({
      email: null,
      membershipId: null,
      userId: null,
      role: null,
      status: null,
      joinedAt: null,
      inviteStatus: null,
      suggestedCounterpartKey: null,
      accountEmail: null,
    });
    // Ownership is still there — that is the part they are entitled to.
    expect(jana.unitCount).toBe(1);
  });

  it('hides members who own nothing from a unit owner', async () => {
    // A board member with no units is not part of the ownership register.
    const { handler } = build();

    const people = await handler.execute(new ListPeopleQuery('t1', false));

    expect(people.map((p) => p.key)).not.toContain('member:m9');
  });

  it('reads holdings as of now', async () => {
    const { handler, holdings } = build();

    await handler.execute(new ListPeopleQuery('t1', true));

    expect(holdings.findHoldings).toHaveBeenCalledWith('t1', NOW);
  });
});
