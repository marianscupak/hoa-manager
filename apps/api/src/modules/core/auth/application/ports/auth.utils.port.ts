export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
  /**
   * Performs a dummy comparison against an internal hash to equalise timing
   * when no real identity exists. Always returns false; exists to prevent
   * user-enumeration via login response timing.
   */
  compareDummy(password: string): Promise<false>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
