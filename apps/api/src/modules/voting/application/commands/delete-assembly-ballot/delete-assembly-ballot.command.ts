export class DeleteAssemblyBallotCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
    public readonly unitId: string,
  ) {}
}
