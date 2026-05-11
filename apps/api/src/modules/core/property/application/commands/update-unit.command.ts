export class UpdateUnitCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly unitNo: string,
    public readonly buildingShareNumerator: number,
    public readonly buildingShareDenominator: number,
  ) {}
}
