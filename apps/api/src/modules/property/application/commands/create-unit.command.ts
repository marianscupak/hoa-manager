export class CreateUnitCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitNo: string,
    public readonly buildingShare: string,
  ) {}
}
