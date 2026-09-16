import { Rational } from '@/shared/domain/rational';

import {
  type PeopleMemberRow,
  type PeopleOwnerRow,
  unionPeople,
} from './people-union';

const owner = (over: Partial<PeopleOwnerRow> = {}): PeopleOwnerRow => ({
  ownerId: 'o1',
  displayName: 'Jana Dvořáková',
  email: null,
  kind: 'PERSON',
  ico: null,
  userId: null,
  hasOwnershipRecords: false,
  inviteStatus: null,
  inviteCreatedAt: null,
  ...over,
});

const member = (over: Partial<PeopleMemberRow> = {}): PeopleMemberRow => ({
  membershipId: 'm1',
  userId: 'u1',
  fullName: 'Jana Dvořáková',
  email: 'jana@hoa.local',
  role: 'UNIT_OWNER',
  status: 'ACTIVE',
  joinedAt: new Date('2026-01-01T00:00:00Z'),
  ...over,
});

const key = (people: { key: string }[]) => people.map((p) => p.key);

describe('unionPeople', () => {
  it('shows a linked owner once, carrying both sides', () => {
    // The whole point of the merge: an owner who can log in is one person.
    const people = unionPeople({
      owners: [owner({ userId: 'u1' })],
      members: [member()],
      holdings: [],
    });

    expect(key(people)).toEqual(['owner:o1']);
    expect(people[0]).toMatchObject({
      source: 'OWNER',
      ownerId: 'o1',
      membershipId: 'm1',
      role: 'UNIT_OWNER',
      status: 'ACTIVE',
    });
  });

  it('keeps an owner with no account and a member who owns nothing', () => {
    const people = unionPeople({
      owners: [
        owner({
          ownerId: 'o2',
          displayName: 'Město Příbram',
          kind: 'LEGAL_ENTITY',
        }),
      ],
      members: [
        member({
          membershipId: 'm9',
          userId: 'u9',
          fullName: 'Karel Malý',
          role: 'BOARD_MEMBER',
        }),
      ],
      holdings: [],
    });

    expect(key(people).sort()).toEqual(['member:m9', 'owner:o2']);
    expect(people.find((p) => p.key === 'owner:o2')).toMatchObject({
      role: null,
      membershipId: null,
    });
    expect(people.find((p) => p.key === 'member:m9')).toMatchObject({
      ownerId: null,
      unitCount: 0,
      kind: null,
    });
  });

  it('counts a unit once and sums the share the party actually holds', () => {
    // A co-owner holds part of a unit; the column answers "what do they own",
    // so it is their share of the building, not the unit's whole share.
    const people = unionPeople({
      owners: [owner()],
      members: [],
      holdings: [
        {
          ownerId: 'o1',
          unitId: 'unit-1',
          unitShareNum: 1,
          unitShareDen: 4,
          partyShareNum: 2,
          partyShareDen: 3,
        },
        {
          ownerId: 'o1',
          unitId: 'unit-2',
          unitShareNum: 1,
          unitShareDen: 4,
          partyShareNum: 1,
          partyShareDen: 1,
        },
      ],
    });

    expect(people[0].unitCount).toBe(2);
    // 2/3 × 1/4 + 1/4 = 1/6 + 1/4 = 5/12
    expect(people[0].share.eq(Rational.from(5, 12))).toBe(true);
  });

  it('gives both spouses the whole SJM share rather than half each', () => {
    // An SJM party is one undivided share held by two people; the app reports
    // it in full on both sides everywhere else (`shares.ts`).
    const people = unionPeople({
      owners: [
        owner({ ownerId: 'o1' }),
        owner({ ownerId: 'o2', displayName: 'Petr Dvořák' }),
      ],
      members: [],
      holdings: [
        {
          ownerId: 'o1',
          unitId: 'unit-1',
          unitShareNum: 1,
          unitShareDen: 4,
          partyShareNum: 1,
          partyShareDen: 1,
        },
        {
          ownerId: 'o2',
          unitId: 'unit-1',
          unitShareNum: 1,
          unitShareDen: 4,
          partyShareNum: 1,
          partyShareDen: 1,
        },
      ],
    });

    expect(people.every((p) => p.share.eq(Rational.from(1, 4)))).toBe(true);
  });

  it('suggests a counterpart on both rows when an e-mail matches', () => {
    const people = unionPeople({
      owners: [owner({ email: 'Jana@HOA.local' })],
      members: [member({ email: 'jana@hoa.local' })],
      holdings: [],
    });

    expect(
      people.find((p) => p.key === 'owner:o1')?.suggestedCounterpartKey,
    ).toBe('member:m1');
    expect(
      people.find((p) => p.key === 'member:m1')?.suggestedCounterpartKey,
    ).toBe('owner:o1');
  });

  it('suggests nothing when either side is already linked', () => {
    // A linked owner is not a duplicate, and a claimed member is not a row.
    const people = unionPeople({
      owners: [owner({ email: 'jana@hoa.local', userId: 'u1' })],
      members: [member({ email: 'jana@hoa.local' })],
      holdings: [],
    });

    expect(people[0].suggestedCounterpartKey).toBeNull();
  });

  it('suggests nothing on a name match alone', () => {
    // Two owners can share a name; an e-mail is unique within an association.
    const people = unionPeople({
      owners: [owner({ email: null })],
      members: [member({ fullName: 'Jana Dvořáková' })],
      holdings: [],
    });

    expect(people.every((p) => p.suggestedCounterpartKey === null)).toBe(true);
  });

  it('orders by display name so the list does not shuffle between requests', () => {
    const people = unionPeople({
      owners: [
        owner({ ownerId: 'o2', displayName: 'Zdeněk' }),
        owner({ ownerId: 'o1', displayName: 'Alena' }),
      ],
      members: [],
      holdings: [],
    });

    expect(people.map((p) => p.displayName)).toEqual(['Alena', 'Zdeněk']);
  });
});
