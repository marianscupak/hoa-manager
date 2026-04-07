export class CloseVoteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly closedByMembershipId?: string,
  ) {}
}
