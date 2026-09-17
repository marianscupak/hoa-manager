export class UpdateOwnershipPeriodCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
    /** Identifies the period: every party of the unit starting at this instant. */
    public readonly periodValidFrom: Date,
    public readonly validFrom: Date,
    public readonly validTo: Date | null,
    /** Set once the board has seen the votes the move reaches. */
    public readonly acknowledged: boolean,
  ) {}
}
