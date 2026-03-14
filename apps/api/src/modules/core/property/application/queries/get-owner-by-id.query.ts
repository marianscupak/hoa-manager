export class GetOwnerByIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
  ) {}
}
