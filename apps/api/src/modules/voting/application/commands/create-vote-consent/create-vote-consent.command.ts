export class CreateVoteConsentCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly unitId: string,
    public readonly membershipId: string,
    public readonly delegateMembershipId: string,
    public readonly roles: string[],
    public readonly ownerMembershipId?: string,
  ) {}
}
