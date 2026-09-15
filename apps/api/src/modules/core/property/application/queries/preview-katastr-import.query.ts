export class PreviewKatastrImportQuery {
  constructor(
    public readonly tenantId: string,
    public readonly xml: string,
    public readonly effectiveAt: Date | null,
  ) {}
}
