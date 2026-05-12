import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UpdateMemberRoleCommand } from '@/modules/core/tenancy/application/commands/update-member-role.command';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

@CommandHandler(UpdateMemberRoleCommand)
export class UpdateMemberRoleHandler
  implements ICommandHandler<UpdateMemberRoleCommand>
{
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(command: UpdateMemberRoleCommand): Promise<void> {
    const membership = await this.membershipRepository.findById(
      command.membershipId,
    );

    if (!membership || membership.tenantId !== command.tenantId) {
      throw new NotFoundException('Membership not found');
    }

    if (
      membership.role === TenantMembershipRole.ADMIN &&
      command.role !== TenantMembershipRole.ADMIN
    ) {
      const members = await this.membershipRepository.listByTenant(
        command.tenantId,
      );
      const admins = members.filter(
        (m) => m.role === TenantMembershipRole.ADMIN,
      );

      if (admins.length <= 1) {
        throw new BadRequestException('Cannot remove the last administrator');
      }
    }

    await this.membershipRepository.updateRole(
      command.membershipId,
      command.role,
    );
  }
}
