import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { voteRulesets, votes } from '@/infrastructure/db/schema';

import { VoteWriteRepository } from '../../application/ports/vote-write.repository.port';
import { VoteAggregate } from '../../domain/vote/vote.aggregate';
import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteStatus,
  VoteWeightBasis,
} from '../../domain/vote/vote.types';

@Injectable()
export class DrizzleVoteWriteRepository implements VoteWriteRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async findById(tenantId: string, id: string): Promise<VoteAggregate | null> {
    const rows = await this.db
      .select()
      .from(votes)
      .leftJoin(voteRulesets, eq(votes.id, voteRulesets.voteId))
      .where(and(eq(votes.tenantId, tenantId), eq(votes.id, id)))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const { votes: vote, vote_rulesets: ruleset } = rows[0];

    return VoteAggregate.rehydrate({
      ...vote,
      status: vote.status as VoteStatus,
      description: vote.description ?? '',
      ruleset: ruleset
        ? {
            weightBasis: ruleset.weightBasis as VoteWeightBasis,
            quorumMeasure: ruleset.quorumMeasure as QuorumMeasure,
            quorumElectorateBasis:
              ruleset.quorumElectorateBasis as QuorumElectorateBasis,
            quorumThreshold: Number(ruleset.quorumThreshold),
            majorityRuleType: ruleset.majorityRuleType as MajorityRuleType,
            majorityThreshold:
              ruleset.majorityThreshold !== null
                ? Number(ruleset.majorityThreshold)
                : null,
            allowAbstain: ruleset.allowAbstain,
            abstainExcludedFromMajorityDenominator:
              ruleset.abstainExcludedFromMajorityDenominator,
          }
        : null,
    });
  }

  async save(vote: VoteAggregate): Promise<void> {
    await this.db.transaction(async (tx) => {
      const voteInsert = this.mapVoteInsert(vote);
      const voteUpdate = this.mapVoteUpdate(vote);

      await tx.insert(votes).values(voteInsert).onConflictDoUpdate({
        target: votes.id,
        set: voteUpdate,
      });

      if (vote.ruleset) {
        const rulesetInsert = this.mapRulesetInsert(vote);
        const rulesetUpdate = this.mapRulesetUpdate(vote);

        await tx.insert(voteRulesets).values(rulesetInsert).onConflictDoUpdate({
          target: voteRulesets.voteId,
          set: rulesetUpdate,
        });
      } else {
        await tx
          .delete(voteRulesets)
          .where(
            and(
              eq(voteRulesets.tenantId, vote.tenantId),
              eq(voteRulesets.voteId, vote.id),
            ),
          );
      }
    });
  }

  private mapVoteInsert(vote: VoteAggregate): typeof votes.$inferInsert {
    return {
      id: vote.id,
      tenantId: vote.tenantId,
      title: vote.title,
      description: vote.description,
      status: vote.status,
      scheduledFrom: vote.scheduledFrom,
      scheduledTo: vote.scheduledTo,
      createdAt: vote.createdAt,
      createdByMembershipId: vote.createdByMembershipId,
      openedAt: vote.openedAt,
      openedByMembershipId: vote.openedByMembershipId,
      closedAt: vote.closedAt,
      closedByMembershipId: vote.closedByMembershipId,
    };
  }

  private mapVoteUpdate(
    vote: VoteAggregate,
  ): Omit<
    typeof votes.$inferInsert,
    'id' | 'tenantId' | 'createdAt' | 'createdByMembershipId'
  > {
    return {
      title: vote.title,
      description: vote.description,
      status: vote.status,
      scheduledFrom: vote.scheduledFrom,
      scheduledTo: vote.scheduledTo,
      openedAt: vote.openedAt,
      openedByMembershipId: vote.openedByMembershipId,
      closedAt: vote.closedAt,
      closedByMembershipId: vote.closedByMembershipId,
    };
  }

  private mapRulesetInsert(
    vote: VoteAggregate,
  ): typeof voteRulesets.$inferInsert {
    if (!vote.ruleset) {
      throw new Error('Cannot map ruleset insert when vote.ruleset is null');
    }

    return {
      tenantId: vote.tenantId,
      voteId: vote.id,
      weightBasis: vote.ruleset.weightBasis,
      quorumMeasure: vote.ruleset.quorumMeasure,
      quorumElectorateBasis: vote.ruleset.quorumElectorateBasis,
      quorumThreshold: vote.ruleset.quorumThreshold.toString(),
      majorityRuleType: vote.ruleset.majorityRuleType,
      majorityThreshold:
        vote.ruleset.majorityThreshold !== null
          ? vote.ruleset.majorityThreshold.toString()
          : null,
      allowAbstain: vote.ruleset.allowAbstain,
      abstainExcludedFromMajorityDenominator:
        vote.ruleset.abstainExcludedFromMajorityDenominator,
    };
  }

  private mapRulesetUpdate(
    vote: VoteAggregate,
  ): Omit<typeof voteRulesets.$inferInsert, 'tenantId' | 'voteId'> {
    if (!vote.ruleset) {
      throw new Error('Cannot map ruleset update when vote.ruleset is null');
    }

    return {
      weightBasis: vote.ruleset.weightBasis,
      quorumMeasure: vote.ruleset.quorumMeasure,
      quorumElectorateBasis: vote.ruleset.quorumElectorateBasis,
      quorumThreshold: vote.ruleset.quorumThreshold.toString(),
      majorityRuleType: vote.ruleset.majorityRuleType,
      majorityThreshold:
        vote.ruleset.majorityThreshold !== null
          ? vote.ruleset.majorityThreshold.toString()
          : null,
      allowAbstain: vote.ruleset.allowAbstain,
      abstainExcludedFromMajorityDenominator:
        vote.ruleset.abstainExcludedFromMajorityDenominator,
    };
  }
}
