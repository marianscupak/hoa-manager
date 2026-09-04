import { CancelScheduledOwnershipTransferCommand } from '@/modules/core/property/application/commands/cancel-scheduled-ownership-transfer.command';
import { OwnershipPartyType } from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';

import { CancelScheduledOwnershipTransferHandler } from './cancel-scheduled-ownership-transfer.handler';

const TENANT = 't1';
const UNIT = 'u1';
const NOW = new Date('2026-09-04T10:00:00Z');
const START_2020 = new Date('2020-03-14T23:00:00Z');
const OCT_2026 = new Date('2026-09-30T22:00:00Z');

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

function buildHandler(existing: UnitOwnershipParty[]) {
  const unitRepo = {
    findById: jest.fn().mockResolvedValue({ id: UNIT, tenantId: TENANT }),
    lockForUpdate: jest.fn(),
  };
  const ownershipRepo = {
    listByUnit: jest.fn().mockResolvedValue(existing),
    deleteParties: jest.fn(),
    reopenParties: jest.fn(),
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
  const handler = new CancelScheduledOwnershipTransferHandler(
    unitRepo as never,
    ownershipRepo as never,
    uow as never,
    clock as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, unitRepo, ownershipRepo, auditService };
}

describe('CancelScheduledOwnershipTransferHandler', () => {
  it('refuses when nothing is scheduled', async () => {
    const { handler, ownershipRepo } = buildHandler([
      party('cur', START_2020, null),
    ]);

    await expect(
      handler.execute(
        new CancelScheduledOwnershipTransferCommand(TENANT, UNIT),
      ),
    ).rejects.toMatchObject({ code: 'OWNERSHIP_NO_SCHEDULED_TRANSFER' });
    expect(ownershipRepo.deleteParties).not.toHaveBeenCalled();
  });

  it('deletes the scheduled parties and reopens the period that was going to end', async () => {
    const { handler, ownershipRepo } = buildHandler([
      party('old', new Date('2011-12-31T23:00:00Z'), START_2020),
      party('cur', START_2020, OCT_2026),
      party('next-a', OCT_2026, null),
      party('next-b', OCT_2026, null),
    ]);

    await handler.execute(
      new CancelScheduledOwnershipTransferCommand(TENANT, UNIT),
    );

    expect(ownershipRepo.deleteParties).toHaveBeenCalledWith(TENANT, [
      'next-a',
      'next-b',
    ]);
    expect(ownershipRepo.reopenParties).toHaveBeenCalledWith(TENANT, ['cur']);
  });

  it('reopens every period whose end matches any scheduled start, not just the earliest', async () => {
    const NOV_2026 = new Date('2026-10-31T23:00:00Z');
    const { handler, ownershipRepo, auditService } = buildHandler([
      party('cur', START_2020, OCT_2026),
      party('s1', OCT_2026, null),
      party('s2', NOV_2026, null),
    ]);

    await handler.execute(
      new CancelScheduledOwnershipTransferCommand(TENANT, UNIT),
    );

    expect(ownershipRepo.deleteParties).toHaveBeenCalledWith(TENANT, [
      's1',
      's2',
    ]);
    expect(ownershipRepo.reopenParties).toHaveBeenCalledWith(TENANT, ['cur']);
    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ effectiveFrom: '2026-10-01' }),
      }),
    );
  });

  it('records the cancelled effective date in the audit event', async () => {
    const { handler, auditService } = buildHandler([
      party('cur', START_2020, OCT_2026),
      party('next', OCT_2026, null),
    ]);

    await handler.execute(
      new CancelScheduledOwnershipTransferCommand(TENANT, UNIT),
    );

    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'CORE.UNIT_OWNERSHIP_TRANSFER_CANCELLED',
        occurredAt: NOW,
        payload: expect.objectContaining({ effectiveFrom: '2026-10-01' }),
      }),
    );
  });
});
