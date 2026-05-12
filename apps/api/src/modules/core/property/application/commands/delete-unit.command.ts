export class DeleteUnitCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
  ) {}
}
