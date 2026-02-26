export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly provider: 'LOCAL' | 'OIDC_GOOGLE',
    public readonly password?: string,
    public readonly providerSubject?: string,
  ) {}
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}
