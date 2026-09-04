import type { UnitReadRepository } from '@/modules/core/property/application/ports/unit-read.repository.port';

import { GetOwnedUnitsHandler } from './get-owned-units.handler';
import { GetOwnedUnitsQuery } from './get-owned-units.query';

describe('GetOwnedUnitsHandler', () => {
  let handler: GetOwnedUnitsHandler;
  let repo: jest.Mocked<UnitReadRepository>;

  const fixedNow = new Date('2026-09-04T10:00:00Z');

  beforeEach(() => {
    repo = { getOverview: jest.fn(), findOwnedByMembership: jest.fn() };
    handler = new GetOwnedUnitsHandler(repo, { now: () => fixedNow });
  });

  it('returns units owned by the caller, sorted ascending by unitNo', async () => {
    repo.findOwnedByMembership.mockResolvedValue([
      {
        id: 'u-b',
        unitNo: 'B-2',
        ownerSharePct: 50,
        buildingSharePct: 8,
        partyType: 'SOLE',
      },
      {
        id: 'u-a',
        unitNo: 'A-1',
        ownerSharePct: 100,
        buildingSharePct: 10,
        partyType: 'SOLE',
      },
      {
        id: 'u-c',
        unitNo: 'A-10',
        ownerSharePct: 25,
        buildingSharePct: 5,
        partyType: 'SJM',
      },
    ]);

    const result = await handler.execute(new GetOwnedUnitsQuery('t-1', 'm-1'));

    expect(result.map((r) => r.unitNo)).toEqual(['A-1', 'A-10', 'B-2']);
    expect(repo.findOwnedByMembership).toHaveBeenCalledWith({
      tenantId: 't-1',
      membershipId: 'm-1',
      now: fixedNow,
    });
  });

  it('returns an empty array when the caller owns nothing', async () => {
    repo.findOwnedByMembership.mockResolvedValue([]);

    const result = await handler.execute(new GetOwnedUnitsQuery('t-1', 'm-1'));

    expect(result).toEqual([]);
  });

  it('returns the five DTO fields per row, nothing extra', async () => {
    // The handler does no transformation — it returns whatever the
    // repo returned. Pinning the field set here ensures the
    // `OwnedUnitRow` contract stays aligned with `OwnedUnitResponseDto`
    // even if a repo implementation ever adds extra columns.
    repo.findOwnedByMembership.mockResolvedValue([
      {
        id: 'u-1',
        unitNo: 'A-1',
        ownerSharePct: 100,
        buildingSharePct: 10,
        partyType: 'SOLE',
      },
    ]);

    const result = await handler.execute(new GetOwnedUnitsQuery('t-1', 'm-1'));

    expect(Object.keys(result[0]).sort()).toEqual(
      ['id', 'unitNo', 'ownerSharePct', 'buildingSharePct', 'partyType'].sort(),
    );
  });
});
