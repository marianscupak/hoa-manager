import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class CreateSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly preferredLanguage: string,
    public readonly tenantId: string,
    public readonly membershipId: string,
    public readonly roles: TenantMembershipRole[],
  ) {}
}
