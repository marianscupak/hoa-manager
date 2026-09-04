import { GetUnitOwnershipHistoryQuery } from '@/modules/core/property/application/queries/get-unit-ownership-history.query';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

import { GetUnitOwnershipHistoryHandler } from './get-unit-ownership-history.handler';

const TENANT = 't1';
const UNIT = 'u1';
const NOW = new Date('2026-09-04T10:00:00Z');
const START_2020 = new Date('2020-03-14T23:00:00Z');
const OCT_2026 = new Date('2026-09-30T22:00:00Z');

function party(
  id: string,
  validFrom: Date,
  validTo: Date | null,
  memberOwnerIds: string[],
): UnitOwnershipParty {
  return {
    id,
    tenantId: TENANT,
    unitId: UNIT,
    partyType:
      memberOwnerIds.length === 2
        ? OwnershipPartyType.SJM
        : OwnershipPartyType.SOLE,
    shareNumerator: 1,
    shareDenominator: 1,
    validFrom,
    validTo,
    memberOwnerIds,
  };
}

const PARTIES = [
  party('cur', START_2020, OCT_2026, ['svoboda']),
  party('next', OCT_2026, null, ['novak', 'novakova']),
];

function buildHandler(overrides?: { hasEverOwned?: boolean; unit?: unknown }) {
  const unitRepo = {
    findById: jest.fn().mockResolvedValue(
      overrides && 'unit' in overrides
        ? overrides.unit
        : {
            id: UNIT,
            tenantId: TENANT,
            unitNo: '12',
            buildingShareNumerator: 1650,
            buildingShareDenominator: 10000,
          },
    ),
  };
  const ownershipRepo = {
    listByUnit: jest.fn().mockResolvedValue(PARTIES),
    hasEverOwnedUnit: jest
      .fn()
      .mockResolvedValue(overrides?.hasEverOwned ?? false),
  };
  const ownerRepo = {
    listByTenant: jest.fn().mockResolvedValue([
      { id: 'svoboda', displayName: 'Petr Svoboda', kind: OwnerKind.PERSON },
      { id: 'novak', displayName: 'Jan Novák', kind: OwnerKind.PERSON },
      { id: 'novakova', displayName: 'Eva Nováková', kind: OwnerKind.PERSON },
    ]),
  };
  const clock = { now: () => NOW };
  const handler = new GetUnitOwnershipHistoryHandler(
    unitRepo as never,
    ownershipRepo as never,
    ownerRepo as never,
    clock as never,
  );
  return { handler, ownershipRepo };
}

const adminQuery = () =>
  new GetUnitOwnershipHistoryQuery(TENANT, UNIT, 'm-admin', [
    TenantMembershipRole.ADMIN,
  ]);
const ownerQuery = () =>
  new GetUnitOwnershipHistoryQuery(TENANT, UNIT, 'm-owner', [
    TenantMembershipRole.UNIT_OWNER,
  ]);

describe('GetUnitOwnershipHistoryHandler', () => {
  it('returns periods newest first with status and resolved member names', async () => {
    const { handler } = buildHandler();

    const result = await handler.execute(adminQuery());

    expect(result.unitId).toBe(UNIT);
    expect(result.unitNo).toBe('12');
    expect(result.periods.map((p) => p.status)).toEqual([
      'SCHEDULED',
      'ACTIVE',
    ]);
    expect(result.periods[0].validFrom).toEqual(OCT_2026);
    expect(result.periods[0].validTo).toBeNull();
    expect(
      result.periods[0].parties[0].members.map((m) => m.displayName),
    ).toEqual(['Jan Novák', 'Eva Nováková']);
    expect(result.periods[1].validTo).toEqual(OCT_2026);
    expect(result.periods[1].parties[0].shareDecimal).toBe('1.0000');
  });

  it("reports the unit's building share so the owner page needs one request", async () => {
    // A former owner, and the incoming owner of a scheduled transfer,
    // may read this history but have no row in `GET /units/mine` — that
    // list only covers ownership active now. The unit header therefore
    // cannot be sourced from the list, so the fraction travels here.
    const { handler } = buildHandler();

    const result = await handler.execute(adminQuery());

    expect(result.buildingShareNumerator).toBe(1650);
    expect(result.buildingShareDenominator).toBe(10000);
  });

  it('lets admins and board members through without an ownership check', async () => {
    const { handler, ownershipRepo } = buildHandler();

    await handler.execute(adminQuery());
    await handler.execute(
      new GetUnitOwnershipHistoryQuery(TENANT, UNIT, 'm-board', [
        TenantMembershipRole.BOARD_MEMBER,
      ]),
    );

    expect(ownershipRepo.hasEverOwnedUnit).not.toHaveBeenCalled();
  });

  it('lets a member who ever owned the unit read the history', async () => {
    const { handler, ownershipRepo } = buildHandler({ hasEverOwned: true });

    const result = await handler.execute(ownerQuery());

    expect(result.periods).toHaveLength(2);
    expect(ownershipRepo.hasEverOwnedUnit).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      'm-owner',
    );
  });

  it('refuses members with no ownership of the unit', async () => {
    const { handler } = buildHandler({ hasEverOwned: false });

    await expect(handler.execute(ownerQuery())).rejects.toMatchObject({
      code: 'NOT_A_UNIT_OWNER',
    });
  });

  it('reports an unknown unit before checking ownership', async () => {
    const { handler, ownershipRepo } = buildHandler({ unit: null });

    await expect(handler.execute(ownerQuery())).rejects.toMatchObject({
      code: 'UNIT_NOT_FOUND',
    });
    expect(ownershipRepo.hasEverOwnedUnit).not.toHaveBeenCalled();
  });
});
