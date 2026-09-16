import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { type OwnerRepository } from '@/modules/core/property/application/ports/property.repository.port';
import { type Clock } from '@/shared/application/ports/clock.port';
import { type UnitOfWork } from '@/shared/application/ports/unit-of-work.port';

import { UnlinkOwnerFromAccountHandler } from './unlink-owner-from-account.handler';
import { UnlinkOwnerFromAccountCommand } from '../commands/unlink-owner-from-account.command';

const ACTOR: AuditActor = {
  type: 'USER',
  userId: 'admin',
  membershipId: 'member-1',
};

function build(options?: { ownerUserId?: string | null }) {
  const cleared: string[] = [];
  const appended: unknown[] = [];

  const ownerRepo = {
    findById: jest.fn(async () => ({
      id: 'o1',
      tenantId: 't1',
      displayName: 'Jana Dvořáková',
      userId: options?.ownerUserId === undefined ? 'u1' : options.ownerUserId,
    })),
    clearUserId: jest.fn(async (_t: string, ownerId: string) => {
      cleared.push(ownerId);
    }),
  } as unknown as OwnerRepository;

  const handler = new UnlinkOwnerFromAccountHandler(
    {
      execute: jest.fn((work: () => Promise<unknown>) => work()),
    } as unknown as UnitOfWork,
    ownerRepo,
    { now: () => new Date('2026-09-16T12:00:00Z') } as Clock,
    {
      append: jest.fn(async (e: unknown) => {
        appended.push(e);
      }),
    } as unknown as AuditService,
    {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService,
    {
      resolveActorLabel: jest.fn().mockResolvedValue('System Admin'),
      resolveOwnerLabel: jest.fn().mockResolvedValue('Jana Dvořáková'),
      resolveUserLabel: jest.fn().mockResolvedValue('jana@hoa.local'),
    } as unknown as CoreAuditLabelResolver,
  );

  return { handler, cleared, appended, ownerRepo };
}

const command = () => new UnlinkOwnerFromAccountCommand('t1', 'o1');

describe('UnlinkOwnerFromAccountHandler', () => {
  it('clears the link and records why the owner can no longer be voted for', async () => {
    const { handler, cleared, appended } = build();

    await handler.execute(command());

    expect(cleared).toEqual(['o1']);
    expect(appended).toHaveLength(1);
  });

  it('refuses an owner that has no account', async () => {
    const { handler, cleared } = build({ ownerUserId: null });

    await expect(handler.execute(command())).rejects.toMatchObject({
      code: 'OWNER_NOT_LINKED',
    });
    expect(cleared).toEqual([]);
  });

  it('names the user in the log even though the link is being removed', async () => {
    // Resolving the label after the write would find nothing to resolve, and
    // the entry would read as if nobody had been unlinked.
    const { handler, appended } = build();

    await handler.execute(command());

    expect(appended[0]).toMatchObject({
      payload: {
        userId: 'u1',
        labels: { userName: 'jana@hoa.local', ownerName: 'Jana Dvořáková' },
      },
    });
  });
});
