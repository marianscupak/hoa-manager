export class SetOwnerEmailCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly email: string,
  ) {}
}
