export interface UserAccess {
  isActive: boolean;
}

/**
 * What the access token guard needs to know about the account a token was
 * issued to. Declared here so the guard stays below every module; identity
 * implements it (IdentityPortsModule).
 */
export interface UserAccessLookup {
  /** `null` when the account no longer exists. */
  findUserAccess(userId: string): Promise<UserAccess | null>;
}

export const USER_ACCESS_LOOKUP = Symbol('USER_ACCESS_LOOKUP');
