import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  InviteNotFoundException,
  InviteAlreadyAcceptedException,
} from '../../../../shared/application/exceptions/invite.exceptions';
import { RevokeOwnerInviteCommand } from '../commands/revoke-owner-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '../ports/owner-invite.repository.port';

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
