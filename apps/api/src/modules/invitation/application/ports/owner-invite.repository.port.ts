import { OwnerInvite } from '../../domain/owner-invite.entity';

export interface OwnerInviteRepository {
  findByTokenHash(tokenHash: string): Promise<OwnerInvite | null>;
  findPendingByOwnerId(
    tenantId: string,
    ownerId: string,
  ): Promise<OwnerInvite | null>;
  upsertForOwner(
    invite: Omit<OwnerInvite, 'id' | 'createdAt' | 'acceptedAt'>,
  ): Promise<OwnerInvite>;
  markAccepted(id: string, now: Date): Promise<void>;
}

export const OWNER_INVITE_REPOSITORY = Symbol('OWNER_INVITE_REPOSITORY');
