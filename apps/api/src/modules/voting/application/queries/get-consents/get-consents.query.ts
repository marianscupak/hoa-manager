export class GetConsentsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly roles: string[],
    public readonly membershipId: string,
  ) {}
}
