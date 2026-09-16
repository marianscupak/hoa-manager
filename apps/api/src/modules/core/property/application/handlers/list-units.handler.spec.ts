import { ListUnitsQuery } from '@/modules/core/property/application/queries/list-units.query';

import { ListUnitsHandler } from './list-units.handler';

const MEMBERSHIP = 'membership-1';
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
  owned?: unknown[];
}) {
  const unitRepo = { listByTenant: jest.fn().mockResolvedValue([UNIT]) };
  const ownershipRepo = {
    listActiveOwnerIdsByTenant: jest
      .fn()
      .mockResolvedValue(overrides?.ownerships ?? []),
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
  // The caller owns nothing unless a test says otherwise; these cases are
  // about the register, not about whose units they are.
  const queryBus = {
    execute: jest.fn().mockResolvedValue(overrides?.owned ?? []),
  };
  const handler = new ListUnitsHandler(
    unitRepo as never,
    ownershipRepo as never,
    ownerRepo as never,
    clock as never,
    queryBus as never,
  );
  return { handler };
}

describe('ListUnitsHandler', () => {
  it('resolves owner display names across ownership parties, deduplicated', async () => {
    // Two parties, one owner in both: the name appears once.
    const { handler } = buildHandler({
      ownerships: [
        { unitId: 'u1', ownerId: 'o1' },
        { unitId: 'u1', ownerId: 'o2' },
        { unitId: 'u1', ownerId: 'o1' },
      ],
    });

    const [unit] = await handler.execute(
      new ListUnitsQuery(TENANT, MEMBERSHIP),
    );

    expect(unit.owners).toEqual(['Jana Nováková', 'Petr Svoboda']);
  });

  it('returns an empty owners array for a unit without active ownerships', async () => {
    const { handler } = buildHandler({ ownerships: [] });

    const [unit] = await handler.execute(
      new ListUnitsQuery(TENANT, MEMBERSHIP),
    );

    expect(unit.owners).toEqual([]);
  });

  it("marks the caller's own units and carries their share", async () => {
    // The register is the whole building; the mark is what makes it usable
    // for someone looking for their own flat in it.
    const { handler } = buildHandler({
      ownerships: [],
      owned: [{ id: 'u1', shareNumerator: 2, shareDenominator: 3 }],
    });

    const [unit] = await handler.execute(
      new ListUnitsQuery(TENANT, MEMBERSHIP),
    );

    expect(unit).toMatchObject({
      mine: true,
      myShareNumerator: 2,
      myShareDenominator: 3,
    });
  });

  it('leaves a unit the caller does not own unmarked', async () => {
    const { handler } = buildHandler({ ownerships: [], owned: [] });

    const [unit] = await handler.execute(
      new ListUnitsQuery(TENANT, MEMBERSHIP),
    );

    expect(unit).toMatchObject({ mine: false, myShareNumerator: null });
  });

  it('exposes the cadastre usage but never the cadastre unit id', async () => {
    const { handler } = buildHandler({ ownerships: [] });

    const [unit] = await handler.execute(
      new ListUnitsQuery(TENANT, MEMBERSHIP),
    );

    expect(unit.usageCode).toBe('1');
    expect(unit.usageName).toBe('byt');
    // An internal matching key has no screen to appear on.
    expect(unit).not.toHaveProperty('katastrUnitId');
  });

  it('reads the register ownerships once, not once per unit', async () => {
    // This endpoint used to be two admins on an admin screen; it is now every
    // resident opening the unit list. A query per unit means a query per
    // resident per flat, which in a real building is hundreds.
    const unitRepo = {
      listByTenant: jest
        .fn()
        .mockResolvedValue([
          UNIT,
          { ...UNIT, id: 'u2', unitNo: '2' },
          { ...UNIT, id: 'u3', unitNo: '3' },
        ]),
    };
    const ownershipRepo = {
      listActiveOwnerIdsByTenant: jest.fn().mockResolvedValue([]),
    };
    const ownerRepo = { listByTenant: jest.fn().mockResolvedValue([]) };
    const clock = { now: jest.fn(() => new Date('2026-09-04T10:00:00Z')) };
    const queryBus = { execute: jest.fn().mockResolvedValue([]) };
    const handler = new ListUnitsHandler(
      unitRepo as never,
      ownershipRepo as never,
      ownerRepo as never,
      clock as never,
      queryBus as never,
    );

    await handler.execute(new ListUnitsQuery(TENANT, MEMBERSHIP));

    expect(ownershipRepo.listActiveOwnerIdsByTenant).toHaveBeenCalledTimes(1);
  });

  it('evaluates every unit against the same `now`, read once per call', async () => {
    const unitRepo = {
      listByTenant: jest
        .fn()
        .mockResolvedValue([UNIT, { ...UNIT, id: 'u2', unitNo: '2' }]),
    };
    const ownershipRepo = {
      listActiveOwnerIdsByTenant: jest.fn().mockResolvedValue([]),
    };
    const ownerRepo = { listByTenant: jest.fn().mockResolvedValue([]) };
    const clock = { now: jest.fn(() => new Date('2026-09-04T10:00:00Z')) };
    const queryBus = { execute: jest.fn().mockResolvedValue([]) };
    const handler = new ListUnitsHandler(
      unitRepo as never,
      ownershipRepo as never,
      ownerRepo as never,
      clock as never,
      queryBus as never,
    );

    await handler.execute(new ListUnitsQuery(TENANT, MEMBERSHIP));

    // One `now` per call, and that same instant decides which ownerships
    // count — otherwise two units in one response could disagree about who
    // owns what.
    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(ownershipRepo.listActiveOwnerIdsByTenant).toHaveBeenCalledWith(
      TENANT,
      new Date('2026-09-04T10:00:00Z'),
    );
  });
});
