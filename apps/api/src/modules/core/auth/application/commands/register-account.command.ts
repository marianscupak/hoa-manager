export class RegisterAccountCommand {
  constructor(
    public readonly email: string,
    public readonly fullName: string,
    public readonly password: string,
  ) {}
}
