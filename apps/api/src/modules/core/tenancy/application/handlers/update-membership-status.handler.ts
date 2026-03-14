import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UpdateMembershipStatusCommand } from '@/modules/core/tenancy/application/commands/update-membership-status.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';

@CommandHandler(UpdateMembershipStatusCommand)
export class UpdateMembershipStatusHandler
  implements ICommandHandler<UpdateMembershipStatusCommand>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async execute(command: UpdateMembershipStatusCommand) {
    return this.membershipRepo.updateStatus(
      command.membershipId,
      command.status,
    );
  }
}
