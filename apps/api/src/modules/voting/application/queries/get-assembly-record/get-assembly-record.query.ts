export class GetAssemblyRecordQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
  ) {}
}
