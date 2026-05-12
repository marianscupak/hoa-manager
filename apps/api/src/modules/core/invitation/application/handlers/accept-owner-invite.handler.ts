import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { AcceptOwnerInviteCommand } from '@/modules/core/invitation/application/commands/accept-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { SetOwnerUserIdCommand } from '@/modules/core/property/application/commands/set-owner-user-id.command';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';
import { CreateMembershipCommand } from '@/modules/core/tenancy/application/commands/create-membership.command';
import { UpdateMembershipStatusCommand } from '@/modules/core/tenancy/application/commands/update-membership-status.command';
import { GetMembershipByTenantAndUserQuery } from '@/modules/core/tenancy/application/queries/get-membership-by-tenant-and-user.query';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import {
  InviteNotFoundException,
  InviteExpiredException,
  InviteAlreadyAcceptedException,
  OwnerAlreadyClaimedException,
  EmailMismatchException,
  EmailNotVerifiedException,
} from '@/shared/application/exceptions/invite.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { normalizeEmail } from '@/shared/application/utils/normalize-email';
import { hashToken } from '@/shared/application/utils/token.utils';

export interface AcceptOwnerInviteResult {
  tenantId: string;
}

@CommandHandler(AcceptOwnerInviteCommand)
export class AcceptOwnerInviteHandler
  implements ICommandHandler<AcceptOwnerInviteCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    command: AcceptOwnerInviteCommand,
  ): Promise<AcceptOwnerInviteResult> {
    return this.uow.execute(async () => {
      const tokenHash = hashToken(command.rawToken);

      const invite = await this.inviteRepo.findByTokenHash(tokenHash);
      if (!invite) {
        throw new InviteNotFoundException();
      }

      if (invite.acceptedAt) {
        throw new InviteAlreadyAcceptedException();
      }

      const now = this.clock.now();
      if (invite.expiresAt < now) {
        throw new InviteExpiredException();
      }

      // Validate the user
      const user = await this.queryBus.execute(
        new GetUserByIdQuery(command.userId),
      );
      if (!user) {
        throw new EmailMismatchException();
      }

      if (!user.isEmailVerified) {
        throw new EmailNotVerifiedException();
      }

      if (normalizeEmail(user.email) !== invite.emailNormalized) {
        throw new EmailMismatchException();
      }

      // Load owner and link
      const owner = await this.queryBus.execute(
        new GetOwnerByIdQuery(invite.tenantId, invite.ownerId),
      );
      if (!owner) {
        throw new InviteNotFoundException();
      }

      if (owner.userId && owner.userId !== user.id) {
        throw new OwnerAlreadyClaimedException();
      }

      if (!owner.userId) {
        await this.commandBus.execute(
          new SetOwnerUserIdCommand(invite.tenantId, invite.ownerId, user.id),
        );
      }

      // Ensure membership exists
      const existing = await this.queryBus.execute(
        new GetMembershipByTenantAndUserQuery(invite.tenantId, user.id),
      );
      if (!existing) {
        await this.commandBus.execute(
          new CreateMembershipCommand(
            invite.tenantId,
            user.id,
            TenantMembershipRole.UNIT_OWNER,
            TenantMembershipStatus.ACTIVE,
          ),
        );
      } else if (existing.status !== TenantMembershipStatus.ACTIVE) {
        await this.commandBus.execute(
          new UpdateMembershipStatusCommand(
            existing.id,
            TenantMembershipStatus.ACTIVE,
          ),
        );
      }

      // Mark invite as accepted
      await this.inviteRepo.markAccepted(invite.id, now);

      return { tenantId: invite.tenantId };
    });
  }
}
