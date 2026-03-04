import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/identity/application/ports/user.repository.port';
import { AcceptOwnerInviteCommand } from '@/modules/invitation/application/commands/accept-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/invitation/application/ports/owner-invite.repository.port';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/modules/property/application/ports/property.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/tenancy/application/ports/tenant.repository.port';
import { TenantMembershipRole } from '@/modules/tenancy/domain/tenant.entity';
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
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
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
      const user = await this.userRepo.findById(command.userId);
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
      const owner = await this.ownerRepo.findById(
        invite.tenantId,
        invite.ownerId,
      );
      if (!owner) {
        throw new InviteNotFoundException();
      }

      if (owner.userId && owner.userId !== user.id) {
        throw new OwnerAlreadyClaimedException();
      }

      if (!owner.userId) {
        await this.ownerRepo.setUserId(
          invite.tenantId,
          invite.ownerId,
          user.id,
        );
      }

      // Ensure membership exists
      const existing = await this.membershipRepo.findByTenantAndUser(
        invite.tenantId,
        user.id,
      );
      if (!existing) {
        await this.membershipRepo.create({
          tenantId: invite.tenantId,
          userId: user.id,
          role: TenantMembershipRole.UNIT_OWNER,
          status: 'ACTIVE',
        });
      } else if (existing.status !== 'ACTIVE') {
        await this.membershipRepo.updateStatus(existing.id, 'ACTIVE');
      }

      // Mark invite as accepted
      await this.inviteRepo.markAccepted(invite.id, now);

      return { tenantId: invite.tenantId };
    });
  }
}
