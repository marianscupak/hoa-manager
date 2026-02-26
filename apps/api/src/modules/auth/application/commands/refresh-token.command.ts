export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly oldAccessToken?: string,
  ) {}
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}
