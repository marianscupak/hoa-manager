import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import { ReplaceUnitOwnershipCommand } from '@/modules/core/property/application/commands/replace-unit-ownership.command';
import { ReplaceUnitOwnershipHandler } from './replace-unit-ownership.handler';

const TENANT = 't1';
const UNIT = 'u1';

function buildHandler(overrides?: {
  owners?: { id: string; kind: OwnerKind }[];
}) {
  const ownersList = overrides?.owners ?? [
    { id: 'p1', kind: OwnerKind.PERSON },
    { id: 'p2', kind: OwnerKind.PERSON },
  ];
  const unitRepo = {
    findById: jest.fn().mockResolvedValue({ id: UNIT, tenantId: TENANT }),
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
  const ownershipRepo = { closeActiveByUnit: jest.fn(), createMany: jest.fn() };
  const uow = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const clock = { now: () => new Date('2026-08-22T10:00:00Z') };
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
  return { handler, ownershipRepo };
}

describe('ReplaceUnitOwnershipHandler (parties)', () => {
  it('replaces ownership with an SJM party holding 1/1', async () => {
    const { handler, ownershipRepo } = buildHandler();
    await handler.execute(
      new ReplaceUnitOwnershipCommand(TENANT, UNIT, [
        {
          partyType: OwnershipPartyType.SJM,
          shareNumerator: 1,
          shareDenominator: 1,
          memberOwnerIds: ['p1', 'p2'],
        },
      ]),
    );
    expect(ownershipRepo.closeActiveByUnit).toHaveBeenCalledWith(
      TENANT,
      UNIT,
      expect.any(Date),
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
      expect.any(Date),
    );
  });

  it('rejects a plan whose fractions do not sum to exactly 1', async () => {
    const { handler } = buildHandler();
    await expect(
      handler.execute(
        new ReplaceUnitOwnershipCommand(TENANT, UNIT, [
          {
            partyType: OwnershipPartyType.SOLE,
            shareNumerator: 1,
            shareDenominator: 2,
            memberOwnerIds: ['p1'],
          },
          {
            partyType: OwnershipPartyType.SOLE,
            shareNumerator: 1,
            shareDenominator: 3,
            memberOwnerIds: ['p2'],
          },
        ]),
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
        new ReplaceUnitOwnershipCommand(TENANT, UNIT, [
          {
            partyType: OwnershipPartyType.SJM,
            shareNumerator: 1,
            shareDenominator: 1,
            memberOwnerIds: ['p1'],
          },
        ]),
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
        new ReplaceUnitOwnershipCommand(TENANT, UNIT, [
          {
            partyType: OwnershipPartyType.SOLE,
            shareNumerator: 1,
            shareDenominator: 2,
            memberOwnerIds: ['svj'],
          },
          {
            partyType: OwnershipPartyType.SOLE,
            shareNumerator: 1,
            shareDenominator: 2,
            memberOwnerIds: ['p1'],
          },
        ]),
      ),
    ).rejects.toMatchObject({
      code: 'OWNERSHIP_MIXED_ASSOCIATION_UNSUPPORTED',
    });
  });
});
