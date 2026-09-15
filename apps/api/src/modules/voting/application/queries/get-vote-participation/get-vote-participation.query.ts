export class GetVoteParticipationQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly requesterMembershipId: string,
  ) {}
}
