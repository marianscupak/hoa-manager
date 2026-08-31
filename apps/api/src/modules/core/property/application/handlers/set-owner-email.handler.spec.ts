import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import { SetOwnerEmailCommand } from '@/modules/core/property/application/commands/set-owner-email.command';

import { SetOwnerEmailHandler } from './set-owner-email.handler';

const TENANT = 't1';
const OWNER = 'o1';

function buildHandler(overrides?: {
  owner?: { id: string; email: string | null } | null;
  ownerWithEmail?: { id: string } | null;
}) {
  const owner =
    overrides?.owner === undefined
      ? { id: OWNER, tenantId: TENANT, displayName: 'Jan Novák', email: null }
      : overrides.owner;
  const ownerRepo = {
    findById: jest.fn().mockResolvedValue(owner),
    findByEmail: jest.fn().mockResolvedValue(overrides?.ownerWithEmail ?? null),
    setEmail: jest.fn(),
  };
  const uow = { execute: jest.fn((fn: () => Promise<void>) => fn()) };
  const clock = { now: () => new Date('2026-08-31T10:00:00Z') };
  const auditService = { append: jest.fn() };
  const auditContext = {
    requireActor: jest.fn().mockReturnValue({ type: 'USER', userId: 'admin' }),
  };
  const labelResolver = {
    resolveActorLabel: jest.fn().mockResolvedValue('Admin'),
  };
  const handler = new SetOwnerEmailHandler(
    ownerRepo as never,
    clock as never,
    uow as never,
    auditService as never,
    auditContext as never,
    labelResolver as never,
  );
  return { handler, ownerRepo, auditService };
}

describe('SetOwnerEmailHandler', () => {
  it('sets the normalized email on an owner without one and appends an audit event', async () => {
    const { handler, ownerRepo, auditService } = buildHandler();

    await handler.execute(
      new SetOwnerEmailCommand(TENANT, OWNER, '  Jan.Novak@Example.COM '),
    );

    expect(ownerRepo.setEmail).toHaveBeenCalledWith(
      TENANT,
      OWNER,
      'jan.novak@example.com',
    );
    expect(auditService.append).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: CoreEventType.OWNER_EMAIL_ADDED,
        aggregate: { type: 'OWNER', id: OWNER },
      }),
    );
  });

  it('rejects when the owner does not exist', async () => {
    const { handler, ownerRepo } = buildHandler({ owner: null });

    await expect(
      handler.execute(new SetOwnerEmailCommand(TENANT, OWNER, 'a@b.cz')),
    ).rejects.toMatchObject({ code: 'OWNER_NOT_FOUND' });
    expect(ownerRepo.setEmail).not.toHaveBeenCalled();
  });

  it('rejects when the owner already has an email', async () => {
    const { handler, ownerRepo } = buildHandler({
      owner: { id: OWNER, email: 'existing@example.com' },
    });

    await expect(
      handler.execute(new SetOwnerEmailCommand(TENANT, OWNER, 'a@b.cz')),
    ).rejects.toMatchObject({ code: 'OWNER_EMAIL_ALREADY_SET' });
    expect(ownerRepo.setEmail).not.toHaveBeenCalled();
  });

  it('rejects when another owner in the tenant already uses the email', async () => {
    const { handler, ownerRepo } = buildHandler({
      ownerWithEmail: { id: 'other-owner' },
    });

    await expect(
      handler.execute(new SetOwnerEmailCommand(TENANT, OWNER, 'a@b.cz')),
    ).rejects.toMatchObject({ code: 'DUPLICATE_OWNER_EMAIL' });
    expect(ownerRepo.setEmail).not.toHaveBeenCalled();
  });
});
