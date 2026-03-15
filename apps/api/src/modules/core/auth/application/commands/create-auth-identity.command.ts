export class CreateAuthIdentityCommand {
  constructor(
    public readonly userId: string,
    public readonly provider: 'LOCAL' | 'OIDC_GOOGLE',
    public readonly providerSubject: string,
    public readonly passwordHash: string | null = null,
  ) {}
}
