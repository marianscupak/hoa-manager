import { ReplaceUnitOwnershipCommand } from '@/modules/core/property/application/commands/replace-unit-ownership.command';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';

import { ReplaceUnitOwnershipHandler } from './replace-unit-ownership.handler';

const TENANT = 't1';
const UNIT = 'u1';
const NOW = new Date('2026-09-04T10:00:00Z');
const START_2020 = new Date('2020-03-14T23:00:00Z');
const TODAY = new Date('2026-09-03T22:00:00Z');
const OCT_2026 = new Date('2026-09-30T22:00:00Z');

const soleParty = (ownerId: string) => ({
  partyType: OwnershipPartyType.SOLE,
  shareNumerator: 1,
  shareDenominator: 1,
  memberOwnerIds: [ownerId],
});

function party(
  id: string,
  validFrom: Date,
  validTo: Date | null,
): UnitOwnershipParty {
  return {
    id,
    tenantId: TENANT,
    unitId: UNIT,
    partyType: OwnershipPartyType.SOLE,
    shareNumerator: 1,
    shareDenominator: 1,
    validFrom,
    validTo,
    memberOwnerIds: ['p1'],
  };
}

function buildHandler(overrides?: {
  owners?: { id: string; kind: OwnerKind }[];
  existing?: UnitOwnershipParty[];
}) {
  const ownersList = overrides?.owners ?? [
    { id: 'p1', kind: OwnerKind.PERSON },
    { id: 'p2', kind: OwnerKind.PERSON },
  ];
  const unitRepo = {
    findById: jest.fn().mockResolvedValue({ id: UNIT, tenantId: TENANT }),
    lockForUpdate: jest.fn(),
  };
  const ownerRepo = {
    listByTenant: jest.fn().mockResolvedValue(
      ownersList.map((o) => ({
        ...o,
        tenantId: TENANT,
        displayName: o.id,
        email: null,
        userId: null,
      })),
    ),
  };
  const ownershipRepo = {
    listByUnit: jest.fn().mockResolvedValue(overrides?.existing ?? []),
    deleteParties: jest.fn(),
    closeParties: jest.fn(),
    createMany: jest.fn(),
  };
  const uow = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const clock = { now: () => NOW };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: jest.fn().mockReturnValue({ type: 'USER', userId: 'admin' }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Admin'),
    resolveUnitLabel: jest.fn().mockResolvedValue('Unit 1'),
    resolveOwnerLabel: jest.fn().mockResolvedValue('Owner'),
  };
  const handler = new ReplaceUnitOwnershipHandler(
    unitRepo as never,
    ownerRepo as never,
    ownershipRepo as never,
    uow as never,
    clock as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, unitRepo, ownershipRepo, auditService };
}

describe('ReplaceUnitOwnershipHandler (plan validation)', () => {
  it('replaces ownership with an SJM party holding 1/1', async () => {
    const { handler, ownershipRepo } = buildHandler();
    await handler.execute(
      new ReplaceUnitOwnershipCommand(
        TENANT,
        UNIT,
        [
          {
            partyType: OwnershipPartyType.SJM,
            shareNumerator: 1,
            shareDenominator: 1,
            memberOwnerIds: ['p1', 'p2'],
          },
        ],
        TODAY,
      ),
    );
    expect(ownershipRepo.createMany).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      [
        expect.objectContaining({
          partyType: 'SJM',
          shareNumerator: 1,
          shareDenominator: 1,
          memberOwnerIds: ['p1', 'p2'],
        }),
      ],
      TODAY,
    );
  });

  it('rejects a plan whose fractions do not sum to exactly 1', async () => {
    const { handler } = buildHandler();
    await expect(
      handler.execute(
        new ReplaceUnitOwnershipCommand(
          TENANT,
          UNIT,
          [
            { ...soleParty('p1'), shareDenominator: 2 },
            { ...soleParty('p2'), shareDenominator: 3 },
          ],
          TODAY,
        ),
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_OWNERSHIP_SUM',
      details: [{ code: 'INVALID_OWNERSHIP_SUM', param: '5/6' }],
    });
  });

  it('rejects SJM parties violating member rules', async () => {
    const { handler } = buildHandler();
    await expect(
      handler.execute(
        new ReplaceUnitOwnershipCommand(
          TENANT,
          UNIT,
          [
            {
              partyType: OwnershipPartyType.SJM,
              shareNumerator: 1,
              shareDenominator: 1,
              memberOwnerIds: ['p1'],
            },
          ],
          TODAY,
        ),
      ),
    ).rejects.toMatchObject({ code: 'OWNERSHIP_SJM_MEMBERS_INVALID' });
  });

  it('rejects mixed association/private ownership', async () => {
    const { handler } = buildHandler({
      owners: [
        { id: 'svj', kind: OwnerKind.ASSOCIATION },
        { id: 'p1', kind: OwnerKind.PERSON },
      ],
    });
    await expect(
      handler.execute(
        new ReplaceUnitOwnershipCommand(
          TENANT,
          UNIT,
          [
            { ...soleParty('svj'), shareDenominator: 2 },
            { ...soleParty('p1'), shareDenominator: 2 },
          ],
          TODAY,
        ),
      ),
    ).rejects.toMatchObject({
      code: 'OWNERSHIP_MIXED_ASSOCIATION_UNSUPPORTED',
    });
  });
});

describe('ReplaceUnitOwnershipHandler (effective date)', () => {
  it('locks the unit row before reading the periods', async () => {
    const { handler, unitRepo, ownershipRepo } = buildHandler({
      existing: [party('cur', START_2020, null)],
    });

    await handler.execute(
      new ReplaceUnitOwnershipCommand(
        TENANT,
        UNIT,
        [soleParty('p2')],
        OCT_2026,
      ),
    );

    expect(unitRepo.lockForUpdate).toHaveBeenCalledWith(TENANT, UNIT);
    expect(unitRepo.lockForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      ownershipRepo.listByUnit.mock.invocationCallOrder[0],
    );
  });

  it('closes the current party at a future effective date and inserts the new plan from it', async () => {
    const { handler, ownershipRepo } = buildHandler({
      existing: [party('cur', START_2020, null)],
    });

    await handler.execute(
      new ReplaceUnitOwnershipCommand(
        TENANT,
        UNIT,
        [soleParty('p2')],
        OCT_2026,
      ),
    );

    expect(ownershipRepo.closeParties).toHaveBeenCalledWith(
      TENANT,
      ['cur'],
      OCT_2026,
    );
    expect(ownershipRepo.deleteParties).not.toHaveBeenCalled();
    expect(ownershipRepo.createMany).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      [expect.objectContaining({ memberOwnerIds: ['p2'] })],
      OCT_2026,
    );
  });

  it('refuses while a transfer is already scheduled', async () => {
    const { handler, ownershipRepo } = buildHandler({
      existing: [
        party('cur', START_2020, OCT_2026),
        party('next', OCT_2026, null),
      ],
    });

    await expect(
      handler.execute(
        new ReplaceUnitOwnershipCommand(TENANT, UNIT, [soleParty('p2')], TODAY),
      ),
    ).rejects.toMatchObject({ code: 'OWNERSHIP_TRANSFER_ALREADY_SCHEDULED' });
    expect(ownershipRepo.createMany).not.toHaveBeenCalled();
  });

  it('refuses an effective date before the current period started', async () => {
    const { handler } = buildHandler({
      existing: [party('cur', START_2020, null)],
    });

    await expect(
      handler.execute(
        new ReplaceUnitOwnershipCommand(
          TENANT,
          UNIT,
          [soleParty('p2')],
          new Date('2019-12-31T23:00:00Z'),
        ),
      ),
    ).rejects.toMatchObject({ code: 'OWNERSHIP_EFFECTIVE_DATE_TOO_EARLY' });
  });

  it('deletes a same-day period instead of leaving a zero-length one', async () => {
    const { handler, ownershipRepo } = buildHandler({
      existing: [party('prev', START_2020, TODAY), party('cur', TODAY, null)],
    });

    await handler.execute(
      new ReplaceUnitOwnershipCommand(TENANT, UNIT, [soleParty('p2')], TODAY),
    );

    expect(ownershipRepo.deleteParties).toHaveBeenCalledWith(TENANT, ['cur']);
    expect(ownershipRepo.closeParties).not.toHaveBeenCalled();
    expect(ownershipRepo.createMany).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      expect.any(Array),
      TODAY,
    );
  });

  it('records the effective calendar date in the audit event', async () => {
    const { handler, auditService } = buildHandler();

    await handler.execute(
      new ReplaceUnitOwnershipCommand(
        TENANT,
        UNIT,
        [soleParty('p1')],
        OCT_2026,
      ),
    );

    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'CORE.UNIT_OWNERSHIP_REPLACED',
        occurredAt: NOW,
        payload: expect.objectContaining({ effectiveFrom: '2026-10-01' }),
      }),
    );
  });
});
