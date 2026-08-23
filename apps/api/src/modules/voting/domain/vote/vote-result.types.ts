/**
 * Domain types for the snapshotted vote result — the tally module's output,
 * re-exported under the persistence-facing names.
 */

export type {
  TallyResult as VoteResultSnapshot,
  TallyQuestionResult as VoteQuestionResultSnapshot,
  TallyOptionResult as VoteOptionResultSnapshot,
} from './tally';
