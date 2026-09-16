import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, isNotNull, lte } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  voteRulesets,
  votes,
  voteQuestions,
  voteOptions,
  voteElectorateUnits,
  ballots,
  ballotAnswers,
  voteResults,
  voteQuestionResults,
  voteOptionResults,
} from '@/infrastructure/db/schema';
import { BallotAlreadyCastException } from '@/shared/application/exceptions/vote.exceptions';
import { isUniqueViolation } from '@/shared/errors/pg-errors';

import { mapRulesetColumns, mapRulesetRow } from './vote-ruleset.mapper';
import {
  VoteWriteRepository,
  type BallotInput,
} from '../../application/ports/vote-write.repository.port';
import { planOptionPersistence } from '../../domain/vote/option-persistence';
import { VoteResultSnapshot } from '../../domain/vote/vote-result.types';
import { VoteAggregate } from '../../domain/vote/vote.aggregate';
import {
  VoteOptionSemantic,
  VoteQuestionType,
  VoteStatus,
  type VoteMode,
  type VoteQuestion,
  type VoteOption,
  ElectorateUnit,
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
      .select({
        vote: votes,
        ruleset: voteRulesets,
      })
      .from(votes)
      .leftJoin(
        voteRulesets,
        and(eq(votes.id, voteRulesets.voteId), isNull(voteRulesets.questionId)),
      )
      .where(and(eq(votes.tenantId, tenantId), eq(votes.id, id)))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const { vote, ruleset } = rows[0];

    const questionRows = await this.db
      .select()
      .from(voteQuestions)
      .where(
        and(eq(voteQuestions.tenantId, tenantId), eq(voteQuestions.voteId, id)),
      )
      .orderBy(voteQuestions.sortOrder);

    const questionIds = questionRows.map((q) => q.id);
    let optionRows: (typeof voteOptions.$inferSelect)[] = [];
    let questionRulesetRows: (typeof voteRulesets.$inferSelect)[] = [];

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

      questionRulesetRows = await this.db
        .select()
        .from(voteRulesets)
        .where(
          and(
            eq(voteRulesets.tenantId, tenantId),
            eq(voteRulesets.voteId, id),
            isNotNull(voteRulesets.questionId),
          ),
        );
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

      const qRuleset = questionRulesetRows.find((r) => r.questionId === q.id);

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.questionType as VoteQuestionType,
        sortOrder: q.sortOrder,
        options: qOptions,
        rulesetOverride: qRuleset ? mapRulesetRow(qRuleset) : undefined,
      };
    });

    return VoteAggregate.rehydrate({
      ...vote,
      status: vote.status as VoteStatus,
      mode: vote.mode as VoteMode,
      description: vote.description ?? '',
      ruleset: ruleset ? mapRulesetRow(ruleset) : null,
      questions,
    });
  }

  async save(vote: VoteAggregate): Promise<void> {
    // Runs on whatever transaction the caller opened. `this.db` already
    // resolves to the ambient one inside a unit of work, so opening another
    // here only bought a SAVEPOINT round-trip per save while making the
    // "one transaction per command" rule untrue on paper.
    const tx = this.db;

    const voteInsert = this.mapVoteInsert(vote);
    const voteUpdate = this.mapVoteUpdate(vote);

    await tx.insert(votes).values(voteInsert).onConflictDoUpdate({
      target: votes.id,
      set: voteUpdate,
    });

    // --- Handle Rulesets (Vote-level and Per-question) ---

    // 1. Fetch all existing rulesets for this vote to determine what to update/insert/delete
    const existingRulesets = await tx
      .select()
      .from(voteRulesets)
      .where(
        and(
          eq(voteRulesets.tenantId, vote.tenantId),
          eq(voteRulesets.voteId, vote.id),
        ),
      );

    // 2. Handle Vote-level Ruleset
    const existingVoteRuleset = existingRulesets.find(
      (r) => r.questionId === null,
    );
    if (vote.ruleset) {
      const rulesetValues = this.mapRulesetUpdate(vote);
      if (existingVoteRuleset) {
        await tx
          .update(voteRulesets)
          .set({ ...rulesetValues, updatedAt: new Date() })
          .where(eq(voteRulesets.id, existingVoteRuleset.id));
      } else {
        await tx.insert(voteRulesets).values(this.mapRulesetInsert(vote));
      }
    } else if (existingVoteRuleset) {
      await tx
        .delete(voteRulesets)
        .where(eq(voteRulesets.id, existingVoteRuleset.id));
    }

    // 3. Handle Per-question Overrides
    const currentQuestionIds = vote.questions.map((q) => q.id);

    // Update or Insert current overrides
    for (const q of vote.questions) {
      const existingOverride = existingRulesets.find(
        (r) => r.questionId === q.id,
      );

      if (q.rulesetOverride) {
        const overrideValues = {
          ...mapRulesetColumns(q.rulesetOverride),
          updatedAt: new Date(),
        };

        if (existingOverride) {
          await tx
            .update(voteRulesets)
            .set(overrideValues)
            .where(eq(voteRulesets.id, existingOverride.id));
        } else {
          await tx
            .insert(voteRulesets)
            .values(this.mapQuestionRulesetInsert(q, vote));
        }
      } else if (existingOverride) {
        // Override removed from an existing question
        await tx
          .delete(voteRulesets)
          .where(eq(voteRulesets.id, existingOverride.id));
      }
    }

    // 4. Cleanup orphaned overrides (for questions that were deleted)
    const orphanedOverrides = existingRulesets.filter(
      (r) =>
        r.questionId !== null && !currentQuestionIds.includes(r.questionId),
    );
    if (orphanedOverrides.length > 0) {
      await tx.delete(voteRulesets).where(
        inArray(
          voteRulesets.id,
          orphanedOverrides.map((r) => r.id),
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
      await tx
        .delete(voteOptions)
        .where(
          and(
            eq(voteOptions.tenantId, vote.tenantId),
            inArray(voteOptions.questionId, questionsToRemove),
          ),
        );
      await tx
        .delete(voteQuestions)
        .where(
          and(
            eq(voteQuestions.tenantId, vote.tenantId),
            inArray(voteQuestions.id, questionsToRemove),
          ),
        );
    }

    if (questionsToInsert.length > 0) {
      await tx
        .insert(voteQuestions)
        .values(questionsToInsert.map((q) => this.mapQuestionInsert(q, vote)));
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
      const existingOptionRows = await tx
        .select({ id: voteOptions.id })
        .from(voteOptions)
        .where(
          and(
            eq(voteOptions.tenantId, vote.tenantId),
            eq(voteOptions.questionId, q.id),
          ),
        );
      const existingOptionIds = existingOptionRows.map((o) => o.id);

      const optionPlan = planOptionPersistence(existingOptionIds, q.options);

      if (optionPlan.toDelete.length > 0) {
        await tx
          .delete(voteOptions)
          .where(
            and(
              eq(voteOptions.tenantId, vote.tenantId),
              inArray(voteOptions.id, optionPlan.toDelete),
            ),
          );
      }

      const optionsToUpdate = q.options.filter((o) =>
        optionPlan.toUpdate.includes(o.id),
      );
      for (const o of optionsToUpdate) {
        await tx
          .update(voteOptions)
          .set({
            label: o.label,
            optionKey: o.optionKey,
            sortOrder: o.sortOrder,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(voteOptions.tenantId, vote.tenantId),
              eq(voteOptions.id, o.id),
            ),
          );
      }

      const optionsToInsert = q.options.filter((o) =>
        optionPlan.toInsert.includes(o.id),
      );
      if (optionsToInsert.length > 0) {
        await tx
          .insert(voteOptions)
          .values(optionsToInsert.map((o) => this.mapOptionInsert(o, q, vote)));
      }
    }
  }

  private mapVoteInsert(vote: VoteAggregate): typeof votes.$inferInsert {
    return {
      id: vote.id,
      tenantId: vote.tenantId,
      title: vote.title,
      description: vote.description,
      status: vote.status,
      mode: vote.mode,
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
      mode: vote.mode,
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
      ...mapRulesetColumns(vote.ruleset),
    };
  }

  private mapRulesetUpdate(
    vote: VoteAggregate,
  ): Omit<typeof voteRulesets.$inferInsert, 'tenantId' | 'voteId'> {
    if (!vote.ruleset) {
      throw new Error('Cannot map ruleset update when vote.ruleset is null');
    }

    return mapRulesetColumns(vote.ruleset);
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

  private mapQuestionRulesetInsert(
    question: VoteQuestion,
    vote: VoteAggregate,
  ): typeof voteRulesets.$inferInsert {
    return {
      tenantId: vote.tenantId,
      voteId: vote.id,
      questionId: question.id,
      ...mapRulesetColumns(question.rulesetOverride!),
    };
  }

  async delete(tenantId: string, voteId: string): Promise<void> {
    await this.db
      .delete(votes)
      .where(and(eq(votes.tenantId, tenantId), eq(votes.id, voteId)));
  }

  async saveElectorateUnits(
    tenantId: string,
    voteId: string,
    units: ElectorateUnit[],
  ): Promise<void> {
    if (units.length === 0) return;

    await this.db.insert(voteElectorateUnits).values(
      units.map((u) => ({
        tenantId,
        voteId,
        unitId: u.unitId,
        representativeMembershipId: u.representativeMembershipId,
        eligibilityStatus: u.eligibilityStatus,
        ineligibleReason: u.ineligibleReason,
        weightNumerator: u.weightNum,
        weightDenominator: u.weightDen,
        snapshottedAt: new Date(),
      })),
    );
  }

  async findScheduledToOpen(now: Date): Promise<VoteAggregate[]> {
    // Cross-tenant query to find all votes that should be opened
    const voteRows = await this.drizzle.db
      .select({ id: votes.id, tenantId: votes.tenantId })
      .from(votes)
      .where(
        and(
          eq(votes.status, VoteStatus.SCHEDULED),
          lte(votes.scheduledFrom, now),
        ),
      );

    const aggregates: VoteAggregate[] = [];
    for (const row of voteRows) {
      const agg = await this.findById(row.tenantId, row.id);
      if (agg) aggregates.push(agg);
    }
    return aggregates;
  }

  // ── Ballot Operations ──────────────────────────────────────

  async saveBallots(
    tenantId: string,
    voteId: string,
    ballotInputs: BallotInput[],
  ): Promise<{ ballotId: string; unitId: string }[]> {
    if (ballotInputs.length === 0) return [];

    const inserted: { ballotId: string; unitId: string }[] = [];

    try {
      for (const input of ballotInputs) {
        const [row] = await this.db
          .insert(ballots)
          .values({
            tenantId,
            voteId,
            unitId: input.unitId,
            castByMembershipId: input.castByMembershipId,
            castMethod: input.castMethod,
            attributionOwnerId: input.attributionOwnerId ?? null,
            attachmentDocumentId: input.attachmentDocumentId ?? null,
            castAt: new Date(),
          })
          .returning({ id: ballots.id });

        inserted.push({ ballotId: row.id, unitId: input.unitId });

        if (input.answers.length > 0) {
          await this.db.insert(ballotAnswers).values(
            input.answers.map((a) => ({
              ballotId: row.id,
              questionId: a.questionId,
              optionId: a.optionId,
            })),
          );
        }
      }
    } catch (error) {
      // Concurrent ballot submissions can both pass the prior
      // hasExistingBallots check under READ COMMITTED. Translate the
      // resulting unique-constraint violation into a clean domain error.
      if (isUniqueViolation(error)) {
        throw new BallotAlreadyCastException();
      }
      throw error;
    }

    return inserted;
  }

  async findElectorateUnitsForMembership(
    tenantId: string,
    voteId: string,
    membershipId: string,
    unitIds: string[],
  ): Promise<{ unitId: string; representativeMembershipId: string | null }[]> {
    if (unitIds.length === 0) return [];

    return this.db
      .select({
        unitId: voteElectorateUnits.unitId,
        representativeMembershipId:
          voteElectorateUnits.representativeMembershipId,
      })
      .from(voteElectorateUnits)
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
          inArray(voteElectorateUnits.unitId, unitIds),
          eq(voteElectorateUnits.representativeMembershipId, membershipId),
        ),
      );
  }

  async findElectorateUnit(
    tenantId: string,
    voteId: string,
    unitId: string,
  ): Promise<{
    unitId: string;
    representativeMembershipId: string | null;
    eligibilityStatus: string;
  } | null> {
    const rows = await this.db
      .select({
        unitId: voteElectorateUnits.unitId,
        representativeMembershipId:
          voteElectorateUnits.representativeMembershipId,
        eligibilityStatus: voteElectorateUnits.eligibilityStatus,
      })
      .from(voteElectorateUnits)
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
          eq(voteElectorateUnits.unitId, unitId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async hasExistingBallots(
    tenantId: string,
    voteId: string,
    unitIds: string[],
  ): Promise<Set<string>> {
    if (unitIds.length === 0) return new Set();

    const rows = await this.db
      .select({ unitId: ballots.unitId })
      .from(ballots)
      .where(
        and(
          eq(ballots.tenantId, tenantId),
          eq(ballots.voteId, voteId),
          inArray(ballots.unitId, unitIds),
        ),
      );

    return new Set(rows.map((r) => r.unitId));
  }

  async findScheduledToClose(now: Date): Promise<VoteAggregate[]> {
    // Cross-tenant query to find all OPEN votes whose scheduledTo has passed
    const voteRows = await this.drizzle.db
      .select({ id: votes.id, tenantId: votes.tenantId })
      .from(votes)
      .where(
        and(eq(votes.status, VoteStatus.OPEN), lte(votes.scheduledTo, now)),
      );

    const aggregates: VoteAggregate[] = [];
    for (const row of voteRows) {
      const agg = await this.findById(row.tenantId, row.id);
      if (agg) aggregates.push(agg);
    }
    return aggregates;
  }

  async saveResults(
    tenantId: string,
    voteId: string,
    snapshot: VoteResultSnapshot,
  ): Promise<void> {
    const [insertedResult] = await this.db
      .insert(voteResults)
      .values({
        tenantId,
        voteId,
        resultStatus: 'COMPUTED',
        quorumMet: snapshot.quorumMet,
        participationWeightNum: snapshot.participationWeight.num,
        participationWeightDen: snapshot.participationWeight.den,
        participationUnitCount: snapshot.participationUnitCount,
        totalVotesWeightNum: snapshot.totalVotesWeight.num,
        totalVotesWeightDen: snapshot.totalVotesWeight.den,
        totalVotesUnitCount: snapshot.totalVotesUnitCount,
        computedAt: new Date(),
      })
      .returning({ id: voteResults.id });

    for (const qr of snapshot.questionResults) {
      const [insertedQr] = await this.db
        .insert(voteQuestionResults)
        .values({
          tenantId,
          voteResultId: insertedResult.id,
          questionId: qr.questionId,
          majorityMet: qr.majorityMet,
          winningOptionId: qr.winningOptionId,
          majorityThresholdNum: qr.majorityThreshold.num,
          majorityThresholdDen: qr.majorityThreshold.den,
          majorityComparator: qr.majorityComparator,
          majorityDenominatorNum: qr.majorityDenominator.num,
          majorityDenominatorDen: qr.majorityDenominator.den,
        })
        .returning({ id: voteQuestionResults.id });

      if (qr.optionResults.length > 0) {
        await this.db.insert(voteOptionResults).values(
          qr.optionResults.map((or) => ({
            tenantId,
            questionResultId: insertedQr.id,
            optionId: or.optionId,
            voteWeightNum: or.voteWeight.num,
            voteWeightDen: or.voteWeight.den,
            voteUnitCount: or.voteUnitCount,
          })),
        );
      }
    }
  }
}
