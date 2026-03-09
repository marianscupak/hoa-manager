export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface VerifyTokenOptions {
  ignoreExpiration?: boolean;
}

export interface TokenSigner {
  signToken(payload: object, expiresInSeconds: number): Promise<string>;
}

export const TOKEN_SIGNER = Symbol('TOKEN_SIGNER');

export interface TokenVerifier {
  verifyToken<T extends object>(
    token: string,
    options?: VerifyTokenOptions,
  ): Promise<T>;
}

export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');
