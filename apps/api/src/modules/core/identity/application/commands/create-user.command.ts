export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly fullName: string,
    /**
     * Whether the address is already proven. Only an identity provider that
     * verified it may pass true; the password flows leave it false.
     */
    public readonly isEmailVerified: boolean = false,
  ) {}
}
