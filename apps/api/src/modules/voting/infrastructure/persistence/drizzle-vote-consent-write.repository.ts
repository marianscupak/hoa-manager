import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  SaveVoteUnitConsentInput,
  VoteConsentWriteRepository,
} from '@/modules/voting/application/ports/vote-consent-write.repository.port';
import { voteUnitConsents } from '@/infrastructure/db/schema/voting/vote-unit-consents';

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
}
