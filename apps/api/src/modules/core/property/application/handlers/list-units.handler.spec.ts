import { ListUnitsQuery } from '@/modules/core/property/application/queries/list-units.query';

import { ListUnitsHandler } from './list-units.handler';

const TENANT = 't1';

const UNIT = {
  id: 'u1',
  tenantId: TENANT,
  unitNo: '1',
  buildingShareNumerator: 1712,
  buildingShareDenominator: 10000,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function buildHandler(overrides?: {
  ownerships?: unknown[];
  owners?: unknown[];
}) {
  const unitRepo = { listByTenant: jest.fn().mockResolvedValue([UNIT]) };
  const ownershipRepo = {
    listActiveByUnit: jest.fn().mockResolvedValue(overrides?.ownerships ?? []),
  };
  const ownerRepo = {
    listByTenant: jest.fn().mockResolvedValue(
      overrides?.owners ?? [
        { id: 'o1', displayName: 'Jana Nováková' },
        { id: 'o2', displayName: 'Petr Svoboda' },
      ],
    ),
  };
  const handler = new ListUnitsHandler(
    unitRepo as never,
    ownershipRepo as never,
    ownerRepo as never,
  );
  return { handler };
}

describe('ListUnitsHandler', () => {
  it('resolves owner display names across ownership parties, deduplicated', async () => {
    const { handler } = buildHandler({
      ownerships: [
        {
          shareNumerator: 1,
          shareDenominator: 2,
          memberOwnerIds: ['o1', 'o2'],
        },
        {
          shareNumerator: 1,
          shareDenominator: 2,
          memberOwnerIds: ['o1'],
        },
      ],
    });

    const [unit] = await handler.execute(new ListUnitsQuery(TENANT));

    expect(unit.owners).toEqual(['Jana Nováková', 'Petr Svoboda']);
    expect(unit.isOwnershipComplete).toBe(true);
  });

  it('returns an empty owners array for a unit without active ownerships', async () => {
    const { handler } = buildHandler({ ownerships: [] });

    const [unit] = await handler.execute(new ListUnitsQuery(TENANT));

    expect(unit.owners).toEqual([]);
    expect(unit.isOwnershipComplete).toBe(false);
  });
});
