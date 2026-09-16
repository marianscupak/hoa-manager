export class ListUnitsQuery {
  constructor(
    public readonly tenantId: string,
    /** Whose units get marked as their own. */
    public readonly membershipId: string,
  ) {}
}
