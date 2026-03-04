export interface OwnerInvite {
  id: string;
  tenantId: string;
  ownerId: string;
  emailNormalized: string;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
}
