import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';

import { renderOwnerInviteEmail } from '@hoa-mngr/emails';

import type {
  EmailSender,
  OutgoingEmail,
} from '@/infrastructure/email/email-sender.port';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { SendOwnerInviteCommand } from '@/modules/core/property/application/commands/send-owner-invite.command';
import { SendOwnerInviteHandler } from '@/modules/core/property/application/handlers/send-owner-invite.handler';
import { type OwnerInviteRepository } from '@/modules/core/property/application/ports/owner-invite.repository.port';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';
import { type Clock } from '@/shared/application/ports/clock.port';
import type { AuditActor } from '@/shared/domain/actor';

// Rendering is covered by @hoa-mngr/emails' own tests. Mocking it here keeps
// this spec about orchestration and spares Jest the renderer's dynamic
// import of react-dom/server, which its default runtime cannot execute.
jest.mock('@hoa-mngr/emails', () => ({
  renderOwnerInviteEmail: jest.fn(),
}));

const renderMock = renderOwnerInviteEmail as jest.MockedFunction<
  typeof renderOwnerInviteEmail
>;

const RENDERED = {
  subject: 'Pozvánka do portálu SVJ Květná 12',
  html: '<p>rendered html</p>',
  text: 'rendered text',
};

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
  let emailSender: { send: jest.Mock<Promise<void>, [OutgoingEmail]> };
  let auditService: { append: jest.Mock };
  let handler: SendOwnerInviteHandler;

  beforeEach(() => {
    renderMock.mockReset();
    renderMock.mockResolvedValue(RENDERED);

    const inviteRepo = {
      upsertForOwner: jest.fn().mockResolvedValue({ id: 'invite-1' }),
    } as unknown as OwnerInviteRepository;
    emailSender = { send: jest.fn().mockResolvedValue(undefined) };
    const clock: Clock = { now: () => new Date('2026-08-22T12:00:00Z') };
    const queryBus = {
      execute: jest.fn((query: unknown) =>
        query instanceof GetOwnerByIdQuery
          ? Promise.resolve({
              id: 'owner-1',
              email: 'Owner@Example.cz',
              userId: null,
            })
          : Promise.resolve({ id: 'tenant-1', name: 'SVJ Květná 12' }),
      ),
    } as unknown as QueryBus;
    auditService = { append: jest.fn().mockResolvedValue(undefined) };
    const auditContext = {
      requireActor: jest.fn().mockReturnValue(ACTOR),
    } as unknown as AuditContextService;
    const labelResolver = {
      resolveActorLabel: jest.fn().mockResolvedValue('John Doe'),
      resolveOwnerLabel: jest.fn().mockResolvedValue('Jane Owner'),
    } as unknown as CoreAuditLabelResolver;

    handler = new SendOwnerInviteHandler(
      inviteRepo,
      emailSender as unknown as EmailSender,
      clock,
      fakeNestConfig({ FRONTEND_URL: 'https://hoa.example.cz' }),
      queryBus,
      auditService as unknown as AuditService,
      auditContext,
      labelResolver,
    );
  });

  it('renders the invite email with the tenant name, invite link and TTL', async () => {
    await handler.execute(
      new SendOwnerInviteCommand('tenant-1', 'owner-1', 'user-1'),
    );

    expect(renderMock).toHaveBeenCalledTimes(1);
    const [props] = renderMock.mock.calls[0];
    expect(props.tenantName).toBe('SVJ Květná 12');
    expect(props.inviteLink).toMatch(
      /^https:\/\/hoa\.example\.cz\/invites\/owner\?token=.+/,
    );
    expect(props.expiresInHours).toBe(72);
  });

  it('sends the rendered email to the normalised owner address', async () => {
    await handler.execute(
      new SendOwnerInviteCommand('tenant-1', 'owner-1', 'user-1'),
    );

    expect(emailSender.send).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledWith({
      to: 'owner@example.cz',
      ...RENDERED,
    });
  });

  it('appends the audit event before sending the email', async () => {
    await handler.execute(
      new SendOwnerInviteCommand('tenant-1', 'owner-1', 'user-1'),
    );

    expect(auditService.append).toHaveBeenCalledTimes(1);
    expect(auditService.append.mock.invocationCallOrder[0]).toBeLessThan(
      emailSender.send.mock.invocationCallOrder[0],
    );
  });
});
