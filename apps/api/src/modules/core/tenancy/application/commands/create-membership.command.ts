import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';

export class CreateMembershipCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly role: TenantMembershipRole,
    public readonly status: TenantMembershipStatus,
  ) {}
}
