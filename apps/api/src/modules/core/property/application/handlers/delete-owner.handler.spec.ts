import { DeleteOwnerCommand } from '@/modules/core/property/application/commands/delete-owner.command';

import { DeleteOwnerHandler } from './delete-owner.handler';

const TENANT = 't1';
const OWNER = 'o1';

function buildHandler(overrides?: { referenced?: boolean; exists?: boolean }) {
  const ownerRepo = {
    findById: jest
      .fn()
      .mockResolvedValue(
        overrides?.exists === false
          ? null
          : { id: OWNER, tenantId: TENANT, displayName: 'Petr Svoboda' },
      ),
    delete: jest.fn(),
  };
  const ownershipRepo = {
    existsMemberRowForOwner: jest
      .fn()
      .mockResolvedValue(overrides?.referenced ?? false),
  };
  const clock = { now: () => new Date('2026-09-04T10:00:00Z') };
  const uow = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: jest.fn().mockReturnValue({ type: 'USER', userId: 'admin' }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Admin'),
  };
  const handler = new DeleteOwnerHandler(
    ownerRepo as never,
    ownershipRepo as never,
    clock as never,
    uow as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, ownerRepo, auditService };
}

describe('DeleteOwnerHandler', () => {
  it('deletes an owner who never appears in an ownership party', async () => {
    const { handler, ownerRepo, auditService } = buildHandler({
      referenced: false,
    });

    await handler.execute(new DeleteOwnerCommand(TENANT, OWNER));

    expect(ownerRepo.delete).toHaveBeenCalledWith(TENANT, OWNER);
    expect(auditService.append).toHaveBeenCalledTimes(1);
  });

  it('refuses to delete an owner referenced by any period, past or current', async () => {
    const { handler, ownerRepo } = buildHandler({ referenced: true });

    await expect(
      handler.execute(new DeleteOwnerCommand(TENANT, OWNER)),
    ).rejects.toMatchObject({ code: 'OWNER_HAS_OWNERSHIP_RECORDS' });
    expect(ownerRepo.delete).not.toHaveBeenCalled();
  });

  it('reports an unknown owner', async () => {
    const { handler } = buildHandler({ exists: false });

    await expect(
      handler.execute(new DeleteOwnerCommand(TENANT, OWNER)),
    ).rejects.toMatchObject({ code: 'OWNER_NOT_FOUND' });
  });
});
