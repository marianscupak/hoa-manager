import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

export class CreateMembershipCommand {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly role: TenantMembershipRole,
    public readonly status: TenantMembershipStatus,
  ) {}
}
