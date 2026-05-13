export interface GoogleTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface CodeExchangeResult {
  idTokenPayload: GoogleTokenPayload;
  accessToken: string;
  refreshToken?: string;
}

export interface GoogleCallbackParams {
  code?: string;
  state?: string;
  iss?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleOidcService {
  getAuthorizationUrl(state: string, nonce: string): Promise<string>;
  exchangeCode(
    params: GoogleCallbackParams,
    expectedNonce: string,
    expectedState?: string,
  ): Promise<CodeExchangeResult>;
}

export const GOOGLE_OIDC_SERVICE = Symbol('GOOGLE_OIDC_SERVICE');
