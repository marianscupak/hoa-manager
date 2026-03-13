export class GetVoterStatusQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly membershipId: string,
  ) {}
}
