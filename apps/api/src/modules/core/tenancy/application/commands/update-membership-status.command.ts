import { TenantMembershipStatus } from '@/shared/domain/membership';

export class UpdateMembershipStatusCommand {
  constructor(
    public readonly membershipId: string,
    public readonly status: TenantMembershipStatus,
  ) {}
}
