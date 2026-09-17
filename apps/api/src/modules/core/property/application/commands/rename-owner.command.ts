export class RenameOwnerCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly displayName: string,
  ) {}
}
