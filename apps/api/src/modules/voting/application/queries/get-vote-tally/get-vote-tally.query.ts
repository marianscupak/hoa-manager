export class GetVoteTallyQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
  ) {}
}
