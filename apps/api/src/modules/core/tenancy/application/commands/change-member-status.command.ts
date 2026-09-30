import { TenantMembershipStatus } from '@/modules/core/tenancy/domain/tenant.entity';

export type ChangeableMemberStatus =
  | TenantMembershipStatus.ACTIVE
  | TenantMembershipStatus.SUSPENDED;

export class ChangeMemberStatusCommand {
  constructor(
    public readonly tenantId: string,
    public readonly membershipId: string,
    /** The admin's own membership, so they cannot lock themselves out. */
    public readonly actorMembershipId: string,
    public readonly status: ChangeableMemberStatus,
  ) {}
}
