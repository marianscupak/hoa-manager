export class ImportKatastrDataCommand {
  constructor(
    public readonly tenantId: string,
    public readonly xml: string,
    public readonly effectiveAt: Date,
    /** The planHash from the preview the admin confirmed. */
    public readonly expectedPlanHash: string,
  ) {}
}
