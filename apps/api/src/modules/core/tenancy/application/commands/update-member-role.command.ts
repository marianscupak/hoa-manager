import { TenantMembershipRole } from '@/shared/domain/membership';

export class UpdateMemberRoleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly membershipId: string,
    public readonly role: TenantMembershipRole,
  ) {}
}
