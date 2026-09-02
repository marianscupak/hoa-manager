import { createHash } from 'node:crypto';

import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { addHours } from 'date-fns';

import { renderOwnerInviteEmail } from '@hoa-mngr/emails';

import {
  EMAIL_SENDER,
  type EmailSender,
} from '@/infrastructure/email/email-sender.port';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { CoreAuditLabelResolver } from '@/modules/core/audit-projections/core-audit-label-resolver.service';
import { SendOwnerInviteCommand } from '@/modules/core/invitation/application/commands/send-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { OwnerInviteSentAuditEvent } from '@/modules/core/invitation/audit/events/owner-invite-sent.event';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';
import { GetTenantByIdQuery } from '@/modules/core/tenancy/application/queries/get-tenant-by-id.query';
import {
  OwnerAlreadyClaimedException,
  OwnerEmailRequiredException,
} from '@/shared/application/exceptions/invite.exceptions';
import { OwnerNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';
import {
  generateToken,
  hashToken,
} from '@/shared/application/utils/token.utils';

const INVITE_TTL_HOURS = 72;

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

@CommandHandler(SendOwnerInviteCommand)
export class SendOwnerInviteHandler
  implements ICommandHandler<SendOwnerInviteCommand>
{
  constructor(
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly configService: ConfigService,
    private readonly queryBus: QueryBus,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: CoreAuditLabelResolver,
  ) {}

  async execute(
    command: SendOwnerInviteCommand,
  ): Promise<{ success: boolean }> {
    const owner = await this.queryBus.execute(
      new GetOwnerByIdQuery(command.tenantId, command.ownerId),
    );
    if (!owner) {
      throw new OwnerNotFoundException();
    }

    if (!owner.email) {
      throw new OwnerEmailRequiredException();
    }

    if (owner.userId) {
      throw new OwnerAlreadyClaimedException();
    }

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const now = this.clock.now();
    const expiresAt = addHours(now, INVITE_TTL_HOURS);
    const emailNormalized = normalizeEmail(owner.email);

    const invite = await this.inviteRepo.upsertForOwner({
      tenantId: command.tenantId,
      ownerId: command.ownerId,
      emailNormalized,
      tokenHash,
      expiresAt,
      createdByUserId: command.senderUserId,
    });

    const actor = this.auditContext.requireActor();
    const actorLabel = await this.labelResolver.resolveActorLabel(actor);
    const ownerLabel = await this.labelResolver.resolveOwnerLabel(
      command.ownerId,
    );
    const emailHash = createHash('sha256')
      .update(emailNormalized)
      .digest('hex');

    await this.auditService.append(
      OwnerInviteSentAuditEvent.build({
        tenantId: command.tenantId,
        ownerId: command.ownerId,
        inviteId: invite.id,
        emailHash,
        actor,
        ownerLabel,
        emailMaskedLabel: maskEmail(emailNormalized),
        sentByLabel: actorLabel,
        occurredAt: now,
      }),
    );

    const tenant = await this.queryBus.execute(
      new GetTenantByIdQuery(command.tenantId),
    );
    const tenantName = tenant?.name ?? 'Unknown Community';

    const appUrl = this.configService.get<string>('FRONTEND_URL');
    const inviteLink = `${appUrl}/invites/owner?token=${rawToken}`;

    const email = await renderOwnerInviteEmail({
      tenantName,
      inviteLink,
      expiresInHours: INVITE_TTL_HOURS,
    });
    await this.emailSender.send({ to: emailNormalized, ...email });

    return { success: true };
  }
}
