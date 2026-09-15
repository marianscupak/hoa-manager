import { ListUnitsQuery } from '@/modules/core/property/application/queries/list-units.query';

import { ListUnitsHandler } from './list-units.handler';

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
  const clock = { now: () => new Date('2026-09-04T10:00:00Z') };
  const handler = new ListUnitsHandler(
    unitRepo as never,
    ownershipRepo as never,
    ownerRepo as never,
    clock as never,
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
  });

  it('returns an empty owners array for a unit without active ownerships', async () => {
    const { handler } = buildHandler({ ownerships: [] });

    const [unit] = await handler.execute(new ListUnitsQuery(TENANT));

    expect(unit.owners).toEqual([]);
  });

  it('exposes the cadastre usage but never the cadastre unit id', async () => {
    const { handler } = buildHandler({ ownerships: [] });

    const [unit] = await handler.execute(new ListUnitsQuery(TENANT));

    expect(unit.usageCode).toBe('1');
    expect(unit.usageName).toBe('byt');
    // An internal matching key has no screen to appear on.
    expect(unit).not.toHaveProperty('katastrUnitId');
  });

  it('evaluates every unit against the same `now`, read once per call', async () => {
    const unitRepo = {
      listByTenant: jest
        .fn()
        .mockResolvedValue([UNIT, { ...UNIT, id: 'u2', unitNo: '2' }]),
    };
    const ownershipRepo = {
      listActiveByUnit: jest.fn().mockResolvedValue([]),
    };
    const ownerRepo = { listByTenant: jest.fn().mockResolvedValue([]) };
    const clock = { now: jest.fn(() => new Date('2026-09-04T10:00:00Z')) };
    const handler = new ListUnitsHandler(
      unitRepo as never,
      ownershipRepo as never,
      ownerRepo as never,
      clock as never,
    );

    await handler.execute(new ListUnitsQuery(TENANT));

    expect(clock.now).toHaveBeenCalledTimes(1);
    const [firstCall, secondCall] = ownershipRepo.listActiveByUnit.mock.calls;
    expect(firstCall).toEqual([TENANT, 'u1', firstCall[2]]);
    expect(secondCall).toEqual([TENANT, 'u2', firstCall[2]]);
  });
});
