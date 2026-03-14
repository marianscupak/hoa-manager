import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class CreateMembershipCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly role: TenantMembershipRole,
    public readonly status: 'ACTIVE' | 'SUSPENDED' | 'INVITED',
  ) {}
}
