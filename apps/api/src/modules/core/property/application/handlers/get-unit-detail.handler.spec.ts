import { GetUnitDetailQuery } from '@/modules/core/property/application/queries/get-unit-detail.query';

import { GetUnitDetailHandler } from './get-unit-detail.handler';

const TENANT = 't1';

const UNIT = {
  id: 'u1',
  tenantId: TENANT,
  unitNo: '1',
  buildingShareNumerator: 1712,
  buildingShareDenominator: 10000,
  katastrUnitId: 'k-unit-1',
  usageCode: '1',
  usageName: 'byt',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function buildHandler(overrides?: {
  ownerships?: unknown[];
  owners?: unknown[];
}) {
  const unitRepo = { findById: jest.fn().mockResolvedValue(UNIT) };
  const ownershipRepo = {
    listActiveByUnit: jest.fn().mockResolvedValue(overrides?.ownerships ?? []),
  };
  const ownerRepo = {
    listByTenant: jest.fn().mockResolvedValue(overrides?.owners ?? []),
  };
  const clock = { now: () => new Date('2026-09-04T10:00:00Z') };
  const handler = new GetUnitDetailHandler(
    unitRepo as never,
    ownershipRepo as never,
    ownerRepo as never,
    clock as never,
  );
  return { handler };
}

describe('GetUnitDetailHandler', () => {
  it('exposes the cadastre usage but never the cadastre unit id', async () => {
    const { handler } = buildHandler();

    const unit = await handler.execute(new GetUnitDetailQuery(TENANT, 'u1'));

    expect(unit.usageCode).toBe('1');
    expect(unit.usageName).toBe('byt');
    // An internal matching key has no screen to appear on.
    expect(unit).not.toHaveProperty('katastrUnitId');
  });

  it('carries the owners with their ids, like the unit list', async () => {
    const party = (id: string, memberOwnerIds: string[]) => ({
      id,
      tenantId: TENANT,
      unitId: 'u1',
      partyType: 'SOLE',
      shareNumerator: 1,
      shareDenominator: 2,
      validFrom: new Date('2026-01-01'),
      validTo: null,
      memberOwnerIds,
    });
    const { handler } = buildHandler({
      ownerships: [party('p1', ['o1']), party('p2', ['o2', 'o1'])],
      owners: [
        { id: 'o1', displayName: 'Jana Nováková', kind: 'PERSON' },
        { id: 'o2', displayName: 'Jana Nováková', kind: 'PERSON' },
      ],
    });

    const unit = await handler.execute(new GetUnitDetailQuery(TENANT, 'u1'));

    // Namesakes stay two owners; one owner in two parties stays one.
    expect(unit.ownerRefs).toEqual([
      { id: 'o1', displayName: 'Jana Nováková' },
      { id: 'o2', displayName: 'Jana Nováková' },
    ]);
  });
});
