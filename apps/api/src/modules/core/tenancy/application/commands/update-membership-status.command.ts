import { TenantMembershipStatus } from '@/modules/core/tenancy/domain/tenant.entity';

export class UpdateMembershipStatusCommand {
  constructor(
    public readonly membershipId: string,
    public readonly status: TenantMembershipStatus,
  ) {}
}
