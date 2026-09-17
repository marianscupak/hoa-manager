export class VerifyEmailCommand {
  constructor(
    public readonly email: string,
    public readonly code: string,
  ) {}
}

export interface VerifyEmailResult {
  accessToken: string;
  refreshToken: string;
}
