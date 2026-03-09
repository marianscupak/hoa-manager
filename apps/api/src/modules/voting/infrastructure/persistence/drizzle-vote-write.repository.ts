import { Injectable } from '@nestjs/common';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { votes } from '@/infrastructure/db/schema';

import { VoteWriteRepository } from '../../application/ports/vote-write.repository.port';
import { VoteAggregate } from '../../domain/vote/vote.aggregate';

@Injectable()
export class DrizzleVoteWriteRepository implements VoteWriteRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async save(vote: VoteAggregate) {
    await this.db
      .insert(votes)
      .values(this.mapVote(vote))
      .onConflictDoUpdate({
        target: votes.id,
        set: this.mapVote(vote),
      });
  }

  private mapVote({
    id,
    tenantId,
    description,
    status,
    title,
    createdAt,
    createdByMembershipId,
    scheduledFrom,
    scheduledTo,
    openedAt,
    openedByMembershipId,
    closedAt,
    closedByMembershipId,
  }: VoteAggregate): typeof votes.$inferInsert {
    return {
      id,
      tenantId,
      title,
      description,
      status,
      scheduledFrom,
      scheduledTo,
      createdByMembershipId,
      createdAt,
      openedAt,
      openedByMembershipId,
      closedAt,
      closedByMembershipId,
    };
  }
}
