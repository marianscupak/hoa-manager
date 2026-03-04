import { Injectable } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { ownerInvites } from '@/infrastructure/db/schema';
import { OwnerInviteRepository } from '@/modules/invitation/application/ports/owner-invite.repository.port';
import { OwnerInvite } from '@/modules/invitation/domain/owner-invite.entity';

@Injectable()
export class DrizzleOwnerInviteRepository implements OwnerInviteRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async findByTokenHash(tokenHash: string): Promise<OwnerInvite | null> {
    const row = await this.db.query.ownerInvites.findFirst({
      where: eq(ownerInvites.tokenHash, tokenHash),
    });
    return row ?? null;
  }

  async findPendingByOwnerId(
    tenantId: string,
    ownerId: string,
  ): Promise<OwnerInvite | null> {
    const row = await this.db.query.ownerInvites.findFirst({
      where: and(
        eq(ownerInvites.tenantId, tenantId),
        eq(ownerInvites.ownerId, ownerId),
        isNull(ownerInvites.acceptedAt),
      ),
    });
    return row ?? null;
  }

  async upsertForOwner(
    invite: Omit<OwnerInvite, 'id' | 'createdAt' | 'acceptedAt'>,
  ): Promise<OwnerInvite> {
    const [row] = await this.db
      .insert(ownerInvites)
      .values({
        tenantId: invite.tenantId,
        ownerId: invite.ownerId,
        emailNormalized: invite.emailNormalized,
        tokenHash: invite.tokenHash,
        expiresAt: invite.expiresAt,
        createdByUserId: invite.createdByUserId,
      })
      .onConflictDoUpdate({
        target: [ownerInvites.tenantId, ownerInvites.ownerId],
        set: {
          tokenHash: invite.tokenHash,
          emailNormalized: invite.emailNormalized,
          expiresAt: invite.expiresAt,
          createdByUserId: invite.createdByUserId,
          acceptedAt: null,
        },
      })
      .returning();
    return row;
  }

  async markAccepted(id: string, now: Date): Promise<void> {
    await this.db
      .update(ownerInvites)
      .set({ acceptedAt: now })
      .where(eq(ownerInvites.id, id));
  }

  async deleteByOwnerId(tenantId: string, ownerId: string): Promise<void> {
    await this.db
      .delete(ownerInvites)
      .where(
        and(
          eq(ownerInvites.tenantId, tenantId),
          eq(ownerInvites.ownerId, ownerId),
        ),
      );
  }
}
