export class GetDelegationCandidatesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly unitId: string,
    public readonly requesterMembershipId: string,
  ) {}
}
