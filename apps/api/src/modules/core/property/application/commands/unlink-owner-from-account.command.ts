export class UnlinkOwnerFromAccountCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
  ) {}
}
