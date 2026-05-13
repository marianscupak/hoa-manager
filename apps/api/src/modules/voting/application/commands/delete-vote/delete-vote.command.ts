export class DeleteVoteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
  ) {}
}
