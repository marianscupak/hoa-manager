import type { TenantMembershipRole } from '@/shared/domain/membership';

export class GetTenantActivityQuery {
  constructor(
    public readonly tenantId: string,
    public readonly viewerUserId: string,
    public readonly viewerRoles: TenantMembershipRole[],
    public readonly viewerLanguage: string,
    public readonly limit: number,
  ) {}
}
