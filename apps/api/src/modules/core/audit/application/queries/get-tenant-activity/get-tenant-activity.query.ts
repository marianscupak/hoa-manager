import type { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

export class GetTenantActivityQuery {
  constructor(
    public readonly tenantId: string,
    public readonly viewerUserId: string,
    public readonly viewerRoles: TenantMembershipRole[],
    public readonly viewerLanguage: string,
    public readonly limit: number,
  ) {}
}
