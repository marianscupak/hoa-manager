export class SendOwnerInviteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly senderUserId: string,
  ) {}
}
