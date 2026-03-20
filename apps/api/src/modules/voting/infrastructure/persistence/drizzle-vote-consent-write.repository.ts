import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { voteUnitConsents } from '@/infrastructure/db/schema/voting/vote-unit-consents';
import {
  SaveVoteUnitConsentInput,
  VoteConsentWriteRepository,
} from '@/modules/voting/application/ports/vote-consent-write.repository.port';
import { VoteUnitConsentStatus } from '@/modules/voting/domain/vote/vote.types';

@Injectable()
export class DrizzleVoteConsentWriteRepository
  implements VoteConsentWriteRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async save(data: SaveVoteUnitConsentInput): Promise<void> {
    const existing = await this.db.query.voteUnitConsents.findFirst({
      where: and(
        eq(voteUnitConsents.tenantId, data.tenantId),
        eq(voteUnitConsents.voteId, data.voteId),
        eq(voteUnitConsents.unitId, data.unitId),
        eq(voteUnitConsents.fromOwnerId, data.fromOwnerId),
      ),
    });

    if (existing) {
      await this.db
        .update(voteUnitConsents)
        .set({
          toMembershipId: data.toMembershipId,
          recordedByMembershipId: data.recordedByMembershipId,
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(voteUnitConsents.id, existing.id));
    } else {
      await this.db.insert(voteUnitConsents).values({
        tenantId: data.tenantId,
        voteId: data.voteId,
        unitId: data.unitId,
        fromOwnerId: data.fromOwnerId,
        toMembershipId: data.toMembershipId,
        recordedByMembershipId: data.recordedByMembershipId,
        status: data.status,
      });
    }
  }

  async findById(
    tenantId: string,
    consentId: string,
  ): Promise<typeof voteUnitConsents.$inferSelect | null> {
    const records = await this.db
      .select()
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.id, consentId),
          eq(voteUnitConsents.tenantId, tenantId),
        ),
      )
      .limit(1);
    return records.length > 0 ? records[0] : null;
  }

  async updateStatus(
    consentId: string,
    status: VoteUnitConsentStatus,
  ): Promise<void> {
    await this.db
      .update(voteUnitConsents)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(voteUnitConsents.id, consentId));
  }
}
