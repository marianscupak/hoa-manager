import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { WINSTON_MODULE_PROVIDER, type WinstonLogger } from 'nest-winston';

import { CreateTenantCommand } from '@/modules/tenancy/application/commands/create-tenant.command';
import {
  MEMBERSHIP_REPOSITORY,
  TENANT_REPOSITORY,
  type MembershipRepository,
  type TenantRepository,
} from '@/modules/tenancy/application/ports/tenant.repository.port';
import { TenantMembershipRole } from '@/modules/tenancy/domain/tenant.entity';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, { tenantId: string }>
{
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async execute(command: CreateTenantCommand): Promise<{ tenantId: string }> {
    return this.uow.execute(async () => {
      const tenant = await this.tenantRepository.create(command.name);

      await this.membershipRepository.create({
        tenantId: tenant.id,
        userId: command.createdByUserId,
        role: TenantMembershipRole.ADMIN,
        status: 'ACTIVE',
      });

      this.logger.log(
        {
          message: 'Tenant created',
          tenantId: tenant.id,
          userId: command.createdByUserId,
        },
        CreateTenantHandler.name,
      );

      return { tenantId: tenant.id };
    });
  }
}
