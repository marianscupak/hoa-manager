export class GetUnitDetailQuery {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
  ) {}
}
