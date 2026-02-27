export class ReplaceUnitOwnershipCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly ownerships: Array<{ ownerId: string; share: string }>,
  ) {}
}
