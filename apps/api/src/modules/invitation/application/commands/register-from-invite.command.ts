export class RegisterFromInviteCommand {
  constructor(
    public readonly rawToken: string,
    public readonly password: string,
  ) {}
}
