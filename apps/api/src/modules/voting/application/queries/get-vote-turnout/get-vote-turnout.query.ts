export class GetVoteTurnoutQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
  ) {}
}
