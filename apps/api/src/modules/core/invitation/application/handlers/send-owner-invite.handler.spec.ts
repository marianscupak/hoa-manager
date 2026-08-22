import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';

import type { EmailSender } from '@/infrastructure/email/email-sender.port';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { SendOwnerInviteCommand } from '@/modules/core/invitation/application/commands/send-owner-invite.command';
import { SendOwnerInviteHandler } from '@/modules/core/invitation/application/handlers/send-owner-invite.handler';
import { type OwnerInviteRepository } from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';
import { type Clock } from '@/shared/application/ports/clock.port';

const ACTOR: AuditActor = {
  type: 'USER',
  userId: 'user-1',
  membershipId: 'member-1',
};

function fakeNestConfig(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, def?: string) => values[key] ?? def,
  } as unknown as ConfigService;
}

describe('SendOwnerInviteHandler', () => {
  let emailSender: jest.Mocked<EmailSender>;
  let handler: SendOwnerInviteHandler;

  beforeEach(() => {
    const inviteRepo = {
      upsertForOwner: jest.fn().mockResolvedValue({ id: 'invite-1' }),
    } as unknown as OwnerInviteRepository;
    emailSender = {
      sendOwnerInvite: jest.fn(),
    } as unknown as jest.Mocked<EmailSender>;
    const clock: Clock = { now: () => new Date('2026-08-22T12:00:00Z') };
    const queryBus = {
      execute: jest.fn((query: unknown) =>
        query instanceof GetOwnerByIdQuery
          ? Promise.resolve({
              id: 'owner-1',
              email: 'owner@example.cz',
              userId: null,
            })
          : Promise.resolve({ id: 'tenant-1', name: 'SVJ Květná 12' }),
      ),
    } as unknown as QueryBus;
    const auditService = { append: jest.fn() } as unknown as AuditService;
    const auditContext = {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService;
    const labelResolver = {
      resolveActorLabel: jest.fn().mockResolvedValue('John Doe'),
      resolveOwnerLabel: jest.fn().mockResolvedValue('Jane Owner'),
    } as unknown as CoreAuditLabelResolver;

    handler = new SendOwnerInviteHandler(
      inviteRepo,
      emailSender,
      clock,
      fakeNestConfig({ FRONTEND_URL: 'https://hoa.example.cz' }),
      queryBus,
      auditService,
      auditContext,
      labelResolver,
    );
  });

  it('builds the invite link from FRONTEND_URL', async () => {
    await handler.execute(
      new SendOwnerInviteCommand('tenant-1', 'owner-1', 'user-1'),
    );

    expect(emailSender.sendOwnerInvite).toHaveBeenCalledTimes(1);
    const [to, inviteLink, tenantName] =
      emailSender.sendOwnerInvite.mock.calls[0];
    expect(to).toBe('owner@example.cz');
    expect(inviteLink).toMatch(
      /^https:\/\/hoa\.example\.cz\/invites\/owner\?token=.+/,
    );
    expect(tenantName).toBe('SVJ Květná 12');
  });
});
