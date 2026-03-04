export class RevokeOwnerInviteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
  ) {}
}
