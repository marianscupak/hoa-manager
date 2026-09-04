import {
  groupIntoPeriods,
  periodStatus,
  scheduledParties,
} from './ownership-periods';
import { OwnershipPartyType } from './ownership-plan';
import type { UnitOwnershipParty } from './property.entity';

const NOW = new Date('2026-09-04T10:00:00Z');
const T2020 = new Date('2020-03-14T23:00:00Z');
const T2026_10 = new Date('2026-09-30T22:00:00Z');

function party(
  id: string,
  validFrom: Date,
  validTo: Date | null,
  memberOwnerIds: string[] = [id],
): UnitOwnershipParty {
  return {
    id,
    tenantId: 't1',
    unitId: 'u1',
    partyType: OwnershipPartyType.SOLE,
    shareNumerator: 1,
    shareDenominator: 1,
    validFrom,
    validTo,
    memberOwnerIds,
  };
}

describe('periodStatus', () => {
  it('is SCHEDULED while valid_from is in the future', () => {
    expect(periodStatus({ validFrom: T2026_10, validTo: null }, NOW)).toBe(
      'SCHEDULED',
    );
  });

  it('is ACTIVE from valid_from (inclusive) while valid_to is null or ahead', () => {
    expect(periodStatus({ validFrom: NOW, validTo: null }, NOW)).toBe('ACTIVE');
    expect(periodStatus({ validFrom: T2020, validTo: T2026_10 }, NOW)).toBe(
      'ACTIVE',
    );
  });

  it('is CLOSED once valid_to has been reached (exclusive end)', () => {
    expect(periodStatus({ validFrom: T2020, validTo: NOW }, NOW)).toBe(
      'CLOSED',
    );
  });
});

describe('scheduledParties', () => {
  it('returns only parties starting after now', () => {
    const parties = [
      party('old', T2020, T2026_10),
      party('next', T2026_10, null),
    ];
    expect(scheduledParties(parties, NOW).map((p) => p.id)).toEqual(['next']);
  });
});

describe('groupIntoPeriods', () => {
  it('groups parties sharing (valid_from, valid_to) and sorts newest first', () => {
    const parties = [
      party('a', new Date('2011-12-31T23:00:00Z'), T2020, ['k']),
      party('b', new Date('2011-12-31T23:00:00Z'), T2020, ['m']),
      party('c', T2020, T2026_10),
      party('d', T2026_10, null, ['n', 'e']),
    ];

    const periods = groupIntoPeriods(parties, NOW);

    expect(periods.map((p) => p.status)).toEqual([
      'SCHEDULED',
      'ACTIVE',
      'CLOSED',
    ]);
    expect(periods[0].parties.map((p) => p.id)).toEqual(['d']);
    expect(periods[1].parties.map((p) => p.id)).toEqual(['c']);
    expect(periods[2].parties.map((p) => p.id)).toEqual(['a', 'b']);
    expect(periods[2].validTo).toEqual(T2020);
  });

  it('returns an empty list for a unit without ownership', () => {
    expect(groupIntoPeriods([], NOW)).toEqual([]);
  });
});
