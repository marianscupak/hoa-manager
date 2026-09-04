import { OwnershipPartyType } from './ownership-plan';
import { planOwnershipTransition } from './ownership-transition';
import type { UnitOwnershipParty } from './property.entity';

const NOW = new Date('2026-09-04T10:00:00Z');
const START_2020 = new Date('2020-03-14T23:00:00Z');
const OCT_2026 = new Date('2026-09-30T22:00:00Z');
const TODAY = new Date('2026-09-03T22:00:00Z');

function party(
  id: string,
  validFrom: Date,
  validTo: Date | null,
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
    memberOwnerIds: [id],
  };
}

describe('planOwnershipTransition', () => {
  it('refuses while a transfer is already scheduled', () => {
    const parties = [
      party('cur', START_2020, OCT_2026),
      party('next', OCT_2026, null),
    ];
    expect(planOwnershipTransition(parties, TODAY, NOW)).toEqual({
      kind: 'REJECT',
      code: 'TRANSFER_ALREADY_SCHEDULED',
    });
  });

  it('refuses an effective date before the current period started', () => {
    const parties = [party('cur', START_2020, null)];
    expect(
      planOwnershipTransition(parties, new Date('2019-12-31T23:00:00Z'), NOW),
    ).toEqual({ kind: 'REJECT', code: 'EFFECTIVE_DATE_TOO_EARLY' });
  });

  it('refuses a date inside an already closed latest period (no owner since)', () => {
    const parties = [party('gone', START_2020, TODAY)];
    expect(
      planOwnershipTransition(parties, new Date('2024-01-01T00:00:00Z'), NOW),
    ).toEqual({ kind: 'REJECT', code: 'EFFECTIVE_DATE_TOO_EARLY' });
  });

  it('deletes the current period when the date equals its start (same-day correction)', () => {
    const parties = [
      party('prev', START_2020, TODAY),
      party('cur-a', TODAY, null),
      party('cur-b', TODAY, null),
    ];
    expect(planOwnershipTransition(parties, TODAY, NOW)).toEqual({
      kind: 'APPLY',
      deletePartyIds: ['cur-a', 'cur-b'],
      closePartyIds: [],
    });
  });

  it('closes the current parties for a future effective date', () => {
    const parties = [party('cur', START_2020, null)];
    expect(planOwnershipTransition(parties, OCT_2026, NOW)).toEqual({
      kind: 'APPLY',
      deletePartyIds: [],
      closePartyIds: ['cur'],
    });
  });

  it('closes the current parties for a past effective date after their start', () => {
    const parties = [party('cur', START_2020, null)];
    expect(
      planOwnershipTransition(parties, new Date('2026-06-14T22:00:00Z'), NOW),
    ).toEqual({ kind: 'APPLY', deletePartyIds: [], closePartyIds: ['cur'] });
  });

  it('applies with nothing to close or delete for a unit without ownership', () => {
    expect(
      planOwnershipTransition([], new Date('2015-05-31T22:00:00Z'), NOW),
    ).toEqual({ kind: 'APPLY', deletePartyIds: [], closePartyIds: [] });
  });

  it('leaves a gap when the latest period is closed and the date is at or after its end', () => {
    const parties = [party('gone', START_2020, TODAY)];
    expect(planOwnershipTransition(parties, TODAY, NOW)).toEqual({
      kind: 'APPLY',
      deletePartyIds: [],
      closePartyIds: [],
    });
  });
});
