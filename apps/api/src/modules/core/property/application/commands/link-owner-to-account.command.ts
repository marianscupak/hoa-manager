export class LinkOwnerToAccountCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly membershipId: string,
  ) {}
}
