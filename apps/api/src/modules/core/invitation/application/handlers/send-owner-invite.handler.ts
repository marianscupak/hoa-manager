import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { addHours } from 'date-fns';

import {
  EMAIL_SENDER,
  type EmailSender,
} from '@/infrastructure/email/email-sender.port';
import { SendOwnerInviteCommand } from '@/modules/core/invitation/application/commands/send-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
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

    await this.inviteRepo.upsertForOwner({
      tenantId: command.tenantId,
      ownerId: command.ownerId,
      emailNormalized,
      tokenHash,
      expiresAt,
      createdByUserId: command.senderUserId,
    });

    const tenant = await this.queryBus.execute(
      new GetTenantByIdQuery(command.tenantId),
    );
    const tenantName = tenant?.name ?? 'Unknown Community';

    const appUrl = this.configService.get<string>(
      'APP_PUBLIC_URL',
      'http://localhost:5173',
    );
    const inviteLink = `${appUrl}/invites/owner?token=${rawToken}`;

    await this.emailSender.sendOwnerInvite(
      emailNormalized,
      inviteLink,
      tenantName,
    );

    return { success: true };
  }
}
