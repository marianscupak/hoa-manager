export interface AuthIdentity {
  id: string;
  userId: string;
  provider: 'LOCAL' | 'OIDC_GOOGLE';
  providerSubject: string;
  passwordHash: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  rotatedFromSessionId: string | null;
  revokedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
}
