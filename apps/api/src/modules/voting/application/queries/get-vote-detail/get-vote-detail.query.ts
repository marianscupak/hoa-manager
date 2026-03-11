export class GetVoteDetailQuery {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
    public readonly roles: string[],
  ) {}
}
