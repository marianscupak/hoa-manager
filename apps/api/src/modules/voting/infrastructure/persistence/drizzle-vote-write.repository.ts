import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  voteRulesets,
  votes,
  voteQuestions,
  voteOptions,
} from '@/infrastructure/db/schema';

import { VoteWriteRepository } from '../../application/ports/vote-write.repository.port';
import { VoteAggregate } from '../../domain/vote/vote.aggregate';
import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestionType,
  VoteStatus,
  VoteWeightBasis,
  type VoteQuestion,
  type VoteOption,
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

    const questionRows = await this.db
      .select()
      .from(voteQuestions)
      .where(
        and(eq(voteQuestions.tenantId, tenantId), eq(voteQuestions.voteId, id)),
      )
      .orderBy(voteQuestions.sortOrder);

    const questionIds = questionRows.map((q) => q.id);
    let optionRows: typeof voteOptions.$inferSelect[] = [];

    if (questionIds.length > 0) {
      optionRows = await this.db
        .select()
        .from(voteOptions)
        .where(
          and(
            eq(voteOptions.tenantId, tenantId),
            inArray(voteOptions.questionId, questionIds),
          ),
        )
        .orderBy(voteOptions.sortOrder);
    }

    const questions: VoteQuestion[] = questionRows.map((q) => {
      const qOptions = optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({
          id: o.id,
          label: o.label,
          sortOrder: o.sortOrder,
          optionKey: o.optionKey as VoteOptionSemantic,
        }));

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.questionType as VoteQuestionType,
        sortOrder: q.sortOrder,
        options: qOptions,
      };
    });

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
      questions,
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

      const existingQuestionRows = await tx
        .select({ id: voteQuestions.id })
        .from(voteQuestions)
        .where(
          and(
            eq(voteQuestions.tenantId, vote.tenantId),
            eq(voteQuestions.voteId, vote.id),
          ),
        );
      const existingQuestionIds = existingQuestionRows.map((q) => q.id);

      const aggregateQuestionIds = vote.questions.map((q) => q.id);
      const questionsToRemove = existingQuestionIds.filter(
        (id) => !aggregateQuestionIds.includes(id),
      );
      const questionsToUpdate = vote.questions.filter((q) =>
        existingQuestionIds.includes(q.id),
      );
      const questionsToInsert = vote.questions.filter(
        (q) => !existingQuestionIds.includes(q.id),
      );

      if (questionsToRemove.length > 0) {
        await tx.delete(voteOptions).where(
          and(
            eq(voteOptions.tenantId, vote.tenantId),
            inArray(voteOptions.questionId, questionsToRemove),
          ),
        );
        await tx.delete(voteQuestions).where(
          and(
            eq(voteQuestions.tenantId, vote.tenantId),
            inArray(voteQuestions.id, questionsToRemove),
          ),
        );
      }

      if (questionsToInsert.length > 0) {
        await tx.insert(voteQuestions).values(
          questionsToInsert.map((q) => this.mapQuestionInsert(q, vote)),
        );
      }

      for (const q of questionsToUpdate) {
        await tx
          .update(voteQuestions)
          .set(this.mapQuestionUpdate(q))
          .where(
            and(
              eq(voteQuestions.tenantId, vote.tenantId),
              eq(voteQuestions.id, q.id),
            ),
          );
      }

      for (const q of vote.questions) {
        await tx.delete(voteOptions).where(
          and(
            eq(voteOptions.tenantId, vote.tenantId),
            eq(voteOptions.questionId, q.id),
          ),
        );
        if (q.options.length > 0) {
          await tx.insert(voteOptions).values(
            q.options.map((o) => this.mapOptionInsert(o, q, vote)),
          );
        }
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

  private mapQuestionInsert(
    question: VoteQuestion,
    vote: VoteAggregate,
  ): typeof voteQuestions.$inferInsert {
    return {
      id: question.id,
      tenantId: vote.tenantId,
      voteId: vote.id,
      questionType: question.type,
      title: question.title,
      description: question.description,
      sortOrder: question.sortOrder,
    };
  }

  private mapQuestionUpdate(
    question: VoteQuestion,
  ): Omit<typeof voteQuestions.$inferInsert, 'id' | 'tenantId' | 'voteId'> {
    return {
      questionType: question.type,
      title: question.title,
      description: question.description,
      sortOrder: question.sortOrder,
    };
  }

  private mapOptionInsert(
    option: VoteOption,
    question: VoteQuestion,
    vote: VoteAggregate,
  ): typeof voteOptions.$inferInsert {
    return {
      id: option.id,
      tenantId: vote.tenantId,
      questionId: question.id,
      label: option.label,
      optionKey: option.optionKey,
      sortOrder: option.sortOrder,
    };
  }
}

