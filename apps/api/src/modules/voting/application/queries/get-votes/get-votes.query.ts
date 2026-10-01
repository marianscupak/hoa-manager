import { type TenantMembershipRole } from '@/shared/domain/membership';

export class GetVotesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly roles: TenantMembershipRole[],
    public readonly membershipId: string,
    public readonly statuses?: string[],
  ) {}
}
