/**
 * Domain types for the snapshotted vote result.
 * These are pure domain types — no DB or NestJS references.
 */

export interface VoteOptionResultSnapshot {
  optionId: string;
  voteWeight: number;
  voteUnitCount: number;
}

export interface VoteQuestionResultSnapshot {
  questionId: string;
  majorityMet: boolean;
  winningOptionId: string | null;
  /**
   * The configured majority threshold fraction (e.g. 0.6667 for ⅔ majority).
   * Null for SIMPLE_MAJORITY (which always uses 0.5, no override).
   */
  majorityThresholdValue: number | null;
  /**
   * The weight used as the majority denominator.
   * Excludes abstain weight if abstainExcludedFromMajorityDenominator = true.
   */
  majorityDenominatorValue: number;
  optionResults: VoteOptionResultSnapshot[];
}

export interface VoteResultSnapshot {
  quorumMet: boolean;
  participationWeight: number;
  participationUnitCount: number;
  /** Total weight of the denominator electorate (ALL or ELIGIBLE, per ruleset) */
  denominatorWeight: number;
  denominatorUnitCount: number;
  questionResults: VoteQuestionResultSnapshot[];
}
