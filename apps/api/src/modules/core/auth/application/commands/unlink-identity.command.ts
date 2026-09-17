export class UnlinkIdentityCommand {
  constructor(
    public readonly userId: string,
    public readonly provider: 'LOCAL' | 'OIDC_GOOGLE',
  ) {}
}
