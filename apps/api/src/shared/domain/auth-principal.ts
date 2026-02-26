export interface AuthPrincipal {
  userId: string;
  subject: string;
  authMethod: 'JWT' | 'OIDC';
  sessionId?: string;
}
