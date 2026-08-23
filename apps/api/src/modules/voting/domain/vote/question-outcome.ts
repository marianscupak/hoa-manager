import { VoteOptionSemantic, VoteQuestionType } from './vote.types';

export type QuestionOutcome =
  | 'APPROVED'
  | 'REJECTED'
  | 'WINNER'
  | 'NOT_DECIDED';

/**
 * Display outcome of one question. Quorum is a vote-level property (per
 * Czech law — see docs/superpowers/specs/2026-08-19-soft-clay-redesign-design.md §3)
 * and only exists for assembly votes; `quorumMet: null` (per rollam) passes
 * straight through to the majority logic. `majorityMet` alone never means
 * "approved": for yes/no questions the winning option can be NO.
 */
export function deriveQuestionOutcome(input: {
  questionType: VoteQuestionType;
  /** `null` for per-rollam votes, which have no quorum by law. */
  quorumMet: boolean | null;
  majorityMet: boolean;
  winningOptionKey: string | null;
}): QuestionOutcome {
  if (input.quorumMet === false) {
    return 'NOT_DECIDED';
  }
  if (input.questionType === VoteQuestionType.YES_NO) {
    return input.majorityMet &&
      input.winningOptionKey === VoteOptionSemantic.YES
      ? 'APPROVED'
      : 'REJECTED';
  }
  return input.majorityMet ? 'WINNER' : 'NOT_DECIDED';
}
