import type {
  OwnedUnitRow,
  UnitReadRepository,
} from '@/modules/core/property/application/ports/unit-read.repository.port';

import { GetOwnedUnitsHandler } from './get-owned-units.handler';
import { GetOwnedUnitsQuery } from './get-owned-units.query';

describe('GetOwnedUnitsHandler', () => {
  let handler: GetOwnedUnitsHandler;
  let repo: jest.Mocked<UnitReadRepository>;

  const fixedNow = new Date('2026-09-04T10:00:00Z');

  const row = (overrides: Partial<OwnedUnitRow> = {}): OwnedUnitRow => ({
    id: 'u-1',
    unitNo: 'A-1',
    ownerSharePct: 100,
    shareNumerator: 1,
    shareDenominator: 1,
    buildingSharePct: 16.5,
    buildingShareNumerator: 1650,
    buildingShareDenominator: 10000,
    partyType: 'SOLE',
    ...overrides,
  });

  beforeEach(() => {
    repo = { getOverview: jest.fn(), findOwnedByMembership: jest.fn() };
    handler = new GetOwnedUnitsHandler(repo, { now: () => fixedNow });
  });

  it('returns units owned by the caller, sorted ascending by unitNo', async () => {
    repo.findOwnedByMembership.mockResolvedValue([
      row({ id: 'u-b', unitNo: 'B-2' }),
      row({ id: 'u-a', unitNo: 'A-1' }),
      row({ id: 'u-c', unitNo: 'A-10', partyType: 'SJM' }),
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

  it('returns the nine DTO fields per row, nothing extra', async () => {
    // The handler does no transformation — it returns whatever the
    // repo returned. Pinning the field set here ensures the
    // `OwnedUnitRow` contract stays aligned with `OwnedUnitResponseDto`
    // even if a repo implementation ever adds extra columns.
    repo.findOwnedByMembership.mockResolvedValue([row()]);

    const result = await handler.execute(new GetOwnedUnitsQuery('t-1', 'm-1'));

    expect(Object.keys(result[0]).sort()).toEqual(
      [
        'id',
        'unitNo',
        'ownerSharePct',
        'shareNumerator',
        'shareDenominator',
        'buildingSharePct',
        'buildingShareNumerator',
        'buildingShareDenominator',
        'partyType',
      ].sort(),
    );
  });

  it('passes the share fractions through untouched', async () => {
    // The owner-facing pages render the fraction as the primary value —
    // "1650/10000" is what the cadastre and the association's documents
    // state, the percentage is a convenience. Neither fraction is
    // reduced or reformatted on the way out.
    repo.findOwnedByMembership.mockResolvedValue([
      row({
        shareNumerator: 3200,
        shareDenominator: 10000,
        buildingShareNumerator: 1650,
        buildingShareDenominator: 10000,
      }),
    ]);

    const [unit] = await handler.execute(new GetOwnedUnitsQuery('t-1', 'm-1'));

    expect(unit.shareNumerator).toBe(3200);
    expect(unit.shareDenominator).toBe(10000);
    expect(unit.buildingShareNumerator).toBe(1650);
    expect(unit.buildingShareDenominator).toBe(10000);
  });
});
