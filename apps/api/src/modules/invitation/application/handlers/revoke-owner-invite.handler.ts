import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RevokeOwnerInviteCommand } from '@/modules/invitation/application/commands/revoke-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/invitation/application/ports/owner-invite.repository.port';
import {
  InviteNotFoundException,
  InviteAlreadyAcceptedException,
} from '@/shared/application/exceptions/invite.exceptions';

@CommandHandler(RevokeOwnerInviteCommand)
export class RevokeOwnerInviteHandler
  implements ICommandHandler<RevokeOwnerInviteCommand>
{
  constructor(
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
  ) {}

  async execute(command: RevokeOwnerInviteCommand): Promise<void> {
    const invite = await this.inviteRepo.findPendingByOwnerId(
      command.tenantId,
      command.ownerId,
    );

    if (!invite) {
      throw new InviteNotFoundException();
    }

    if (invite.acceptedAt) {
      throw new InviteAlreadyAcceptedException();
    }

    await this.inviteRepo.deleteByOwnerId(command.tenantId, command.ownerId);
  }
}
