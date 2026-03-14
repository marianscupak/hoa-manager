import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateMembershipCommand } from '@/modules/core/tenancy/application/commands/create-membership.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';

@CommandHandler(CreateMembershipCommand)
export class CreateMembershipHandler
  implements ICommandHandler<CreateMembershipCommand>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async execute(command: CreateMembershipCommand) {
    return this.membershipRepo.create({
      tenantId: command.tenantId,
      userId: command.userId,
      role: command.role,
      status: command.status,
    });
  }
}
