export class SetOwnerUserIdCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly userId: string,
  ) {}
}
