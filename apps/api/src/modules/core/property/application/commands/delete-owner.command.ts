export class DeleteOwnerCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
  ) {}
}
