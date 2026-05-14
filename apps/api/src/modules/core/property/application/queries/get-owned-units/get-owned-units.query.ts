export class GetOwnedUnitsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly membershipId: string,
  ) {}
}
