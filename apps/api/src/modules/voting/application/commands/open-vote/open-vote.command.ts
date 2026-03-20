export class OpenVoteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly openedByMembershipId?: string,
  ) {}
}
