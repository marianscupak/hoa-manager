export class GetVoteResultsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
  ) {}
}
