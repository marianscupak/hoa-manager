import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import { RenameOwnerCommand } from '@/modules/core/property/application/commands/rename-owner.command';

import { RenameOwnerHandler } from './rename-owner.handler';

const TENANT = 't1';
const OWNER = 'o1';

function buildHandler(overrides?: {
  owner?: { id: string; displayName: string } | null;
}) {
  const owner =
    overrides?.owner === undefined
      ? { id: OWNER, tenantId: TENANT, displayName: 'Jana Dvořáková' }
      : overrides.owner;
  const ownerRepo = {
    findById: jest.fn().mockResolvedValue(owner),
    setDisplayName: jest.fn(),
  };
  const uow = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const clock = { now: () => new Date('2026-09-17T10:00:00Z') };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: jest.fn().mockReturnValue({ type: 'USER', userId: 'admin' }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Admin'),
  };
  const handler = new RenameOwnerHandler(
    ownerRepo as never,
    clock as never,
    uow as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, ownerRepo, auditService };
}

describe('RenameOwnerHandler', () => {
  it('writes the new name and records both names in the audit event', async () => {
    const { handler, ownerRepo, auditService } = buildHandler();

    await handler.execute(
      new RenameOwnerCommand(TENANT, OWNER, 'Jana Nováková'),
    );

    expect(ownerRepo.setDisplayName).toHaveBeenCalledWith(
      TENANT,
      OWNER,
      'Jana Nováková',
    );
    // Both names, because the register carries no name history: after the
    // rename the old one survives only here.
    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CoreEventType.OWNER_RENAMED,
        aggregate: { type: 'OWNER', id: OWNER },
        payload: expect.objectContaining({
          labels: expect.objectContaining({
            previousName: 'Jana Dvořáková',
            ownerName: 'Jana Nováková',
          }),
        }),
      }),
    );
  });

  it('trims the surrounding whitespace', async () => {
    const { handler, ownerRepo } = buildHandler();

    await handler.execute(
      new RenameOwnerCommand(TENANT, OWNER, '  Jana Nováková  '),
    );

    expect(ownerRepo.setDisplayName).toHaveBeenCalledWith(
      TENANT,
      OWNER,
      'Jana Nováková',
    );
  });

  it('rejects a name that is blank once trimmed', async () => {
    const { handler, ownerRepo } = buildHandler();

    await expect(
      handler.execute(new RenameOwnerCommand(TENANT, OWNER, '   ')),
    ).rejects.toMatchObject({ code: 'OWNER_NAME_REQUIRED' });
    expect(ownerRepo.setDisplayName).not.toHaveBeenCalled();
  });

  it('rejects when the owner does not exist', async () => {
    const { handler, ownerRepo } = buildHandler({ owner: null });

    await expect(
      handler.execute(new RenameOwnerCommand(TENANT, OWNER, 'Jana Nováková')),
    ).rejects.toMatchObject({ code: 'OWNER_NOT_FOUND' });
    expect(ownerRepo.setDisplayName).not.toHaveBeenCalled();
  });

  it('does not touch the register when the name is unchanged', async () => {
    const { handler, ownerRepo, auditService } = buildHandler();

    await handler.execute(
      new RenameOwnerCommand(TENANT, OWNER, 'Jana Dvořáková'),
    );

    expect(ownerRepo.setDisplayName).not.toHaveBeenCalled();
    expect(auditService.append).not.toHaveBeenCalled();
  });
});
