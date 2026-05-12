import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class UpdateMemberRoleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly membershipId: string,
    public readonly role: TenantMembershipRole,
  ) {}
}
