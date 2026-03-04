export class AcceptOwnerInviteCommand {
  constructor(
    public readonly rawToken: string,
    public readonly userId: string,
  ) {}
}
