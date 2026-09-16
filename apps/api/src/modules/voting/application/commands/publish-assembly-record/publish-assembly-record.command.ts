export class PublishAssemblyRecordCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
  ) {}
}
