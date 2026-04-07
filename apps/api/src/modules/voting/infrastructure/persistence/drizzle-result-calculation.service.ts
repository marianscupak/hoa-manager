import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  ballotAnswers,
  ballots,
  voteElectorateUnits,
} from '@/infrastructure/db/schema';
import {
  VoteOptionResultSnapshot,
  VoteQuestionResultSnapshot,
  VoteResultSnapshot,
} from '@/modules/voting/domain/vote/vote-result.types';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestion,
  VoteRuleset,
} from '@/modules/voting/domain/vote/vote.types';

import { ResultCalculationService } from '../../application/ports/result-calculation.service.port';

@Injectable()
export class DrizzleResultCalculationService
  implements ResultCalculationService
{
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async calculate(
    tenantId: string,
    voteId: string,
    vote: VoteAggregate,
  ): Promise<VoteResultSnapshot> {
    if (!vote.ruleset) {
      throw new Error(
        `Vote ${voteId} has no ruleset — cannot calculate results`,
      );
    }

    // ── 1. Load electorate snapshot ────────────────────────────────
    const electorateRows = await this.db
      .select()
      .from(voteElectorateUnits)
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
        ),
      );

    // ── 2. Load all ballots + answers for this vote ─────────────────
    const ballotRows = await this.db
      .select({
        ballotId: ballots.id,
        unitId: ballots.unitId,
      })
      .from(ballots)
      .where(and(eq(ballots.tenantId, tenantId), eq(ballots.voteId, voteId)));

    const ballotIds = ballotRows.map((b) => b.ballotId);
    const answerRows =
      ballotIds.length > 0
        ? await this.db
            .select({
              ballotId: ballotAnswers.ballotId,
              questionId: ballotAnswers.questionId,
              optionId: ballotAnswers.optionId,
            })
            .from(ballotAnswers)
            .where(inArray(ballotAnswers.ballotId, ballotIds))
        : [];

    // ── 3. Build lookup maps ────────────────────────────────────────
    // unitId -> votingWeight (from snapshot, not live data)
    const weightByUnit = new Map<string, number>(
      electorateRows.map((e) => [e.unitId, Number(e.votingWeight)]),
    );

    // unitId -> eligibilityStatus
    const eligibilityByUnit = new Map<string, string>(
      electorateRows.map((e) => [e.unitId, e.eligibilityStatus]),
    );

    // ballotId -> unitId
    const unitByBallot = new Map<string, string>(
      ballotRows.map((b) => [b.ballotId, b.unitId]),
    );

    // Set of unitIds that submitted a ballot
    const participatingUnitIds = new Set(ballotRows.map((b) => b.unitId));

    // ── 4. Quorum calculation (vote-level ruleset) ──────────────────
    const ruleset = vote.ruleset;

    const { denominatorWeight, denominatorUnitCount } = this.computeDenominator(
      electorateRows,
      ruleset,
    );

    let participationWeight = 0;
    for (const unitId of participatingUnitIds) {
      participationWeight += weightByUnit.get(unitId) ?? 0;
    }
    const participationUnitCount = participatingUnitIds.size;

    const quorumMet = this.checkQuorum(
      ruleset,
      participationWeight,
      participationUnitCount,
      denominatorWeight,
      denominatorUnitCount,
    );

    // ── 5. Per-question results ─────────────────────────────────────
    const questionResults: VoteQuestionResultSnapshot[] = [];

    for (const question of vote.questions) {
      const effectiveRuleset = question.rulesetOverride ?? ruleset;

      // answers for this question: ballotId -> optionId
      const answersForQuestion = answerRows.filter(
        (a) => a.questionId === question.id,
      );

      const questionResult = this.computeQuestionResult(
        question,
        effectiveRuleset,
        answersForQuestion,
        unitByBallot,
        weightByUnit,
        eligibilityByUnit,
      );

      questionResults.push(questionResult);
    }

    return {
      quorumMet,
      participationWeight,
      participationUnitCount,
      denominatorWeight,
      denominatorUnitCount,
      questionResults,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private computeDenominator(
    electorateRows: {
      unitId: string;
      eligibilityStatus: string;
      votingWeight: string;
    }[],
    ruleset: VoteRuleset,
  ): { denominatorWeight: number; denominatorUnitCount: number } {
    const useEligibleOnly =
      ruleset.quorumElectorateBasis ===
      QuorumElectorateBasis.ELIGIBLE_UNITS_ONLY;

    const relevantRows = useEligibleOnly
      ? electorateRows.filter(
          (e) => e.eligibilityStatus === ElectorateEligibilityStatus.ELIGIBLE,
        )
      : electorateRows;

    const denominatorWeight = relevantRows.reduce(
      (sum, e) => sum + Number(e.votingWeight),
      0,
    );
    const denominatorUnitCount = relevantRows.length;

    return { denominatorWeight, denominatorUnitCount };
  }

  private checkQuorum(
    ruleset: VoteRuleset,
    participationWeight: number,
    participationUnitCount: number,
    denominatorWeight: number,
    denominatorUnitCount: number,
  ): boolean {
    const threshold = ruleset.quorumThreshold / 100;

    if (ruleset.quorumMeasure === QuorumMeasure.UNIT_SHARE) {
      if (denominatorWeight === 0) return false;
      return participationWeight / denominatorWeight >= threshold;
    } else {
      // UNIT_COUNT
      if (denominatorUnitCount === 0) return false;
      return participationUnitCount / denominatorUnitCount >= threshold;
    }
  }

  private computeQuestionResult(
    question: VoteQuestion,
    effectiveRuleset: VoteRuleset,
    answers: { ballotId: string; questionId: string; optionId: string }[],
    unitByBallot: Map<string, string>,
    weightByUnit: Map<string, number>,
    _eligibilityByUnit: Map<string, string>,
  ): VoteQuestionResultSnapshot {
    // Aggregate weight per option
    const weightByOption = new Map<string, number>();
    const countByOption = new Map<string, number>();

    for (const option of question.options) {
      weightByOption.set(option.id, 0);
      countByOption.set(option.id, 0);
    }

    for (const answer of answers) {
      const unitId = unitByBallot.get(answer.ballotId);
      if (!unitId) continue;

      const weight = weightByUnit.get(unitId) ?? 0;
      weightByOption.set(
        answer.optionId,
        (weightByOption.get(answer.optionId) ?? 0) + weight,
      );
      countByOption.set(
        answer.optionId,
        (countByOption.get(answer.optionId) ?? 0) + 1,
      );
    }

    // Build per-option snapshots
    const optionResults: VoteOptionResultSnapshot[] = question.options.map(
      (opt) => ({
        optionId: opt.id,
        voteWeight: weightByOption.get(opt.id) ?? 0,
        voteUnitCount: countByOption.get(opt.id) ?? 0,
      }),
    );

    // Majority denominator: exclude abstain weight if configured
    const abstainOptionId = question.options.find(
      (o) => o.optionKey === VoteOptionSemantic.ABSTAIN,
    )?.id;

    let majorityDenominatorValue = 0;
    for (const opt of question.options) {
      const w = weightByOption.get(opt.id) ?? 0;
      if (
        effectiveRuleset.abstainExcludedFromMajorityDenominator &&
        opt.id === abstainOptionId
      ) {
        continue;
      }
      majorityDenominatorValue += w;
    }

    // Find winning option (highest weight, excluding abstain from contention)
    const nonAbstainOptions = question.options.filter(
      (o) => o.id !== abstainOptionId,
    );

    let winningOptionId: string | null = null;
    let maxWeight = -1;
    let hasTie = false;

    for (const opt of nonAbstainOptions) {
      const w = weightByOption.get(opt.id) ?? 0;
      if (w > maxWeight) {
        maxWeight = w;
        winningOptionId = opt.id;
        hasTie = false;
      } else if (w === maxWeight && maxWeight > 0) {
        hasTie = true;
      }
    }

    if (hasTie) {
      winningOptionId = null;
    }

    // Check majority
    let majorityMet = false;
    let majorityThresholdValue: number | null = null;

    if (winningOptionId !== null && majorityDenominatorValue > 0) {
      const winningWeight = weightByOption.get(winningOptionId) ?? 0;

      if (
        effectiveRuleset.majorityRuleType === MajorityRuleType.SIMPLE_MAJORITY
      ) {
        majorityMet = winningWeight / majorityDenominatorValue > 0.5;
        // Simple majority always uses >50%; no configurable threshold to snapshot
        majorityThresholdValue = null;
      } else {
        // QUALIFIED_MAJORITY
        const threshold = (effectiveRuleset.majorityThreshold ?? 50) / 100;
        majorityThresholdValue = threshold;
        majorityMet = winningWeight / majorityDenominatorValue >= threshold;
      }
    }

    if (!majorityMet) {
      winningOptionId = null;
    }

    return {
      questionId: question.id,
      majorityMet,
      winningOptionId,
      majorityThresholdValue,
      majorityDenominatorValue,
      optionResults,
    };
  }
}
