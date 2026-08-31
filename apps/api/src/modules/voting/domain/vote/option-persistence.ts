export interface OptionPersistencePlan {
  toDelete: string[];
  toUpdate: string[];
  toInsert: string[];
}

/**
 * Diffs a question's persisted options against the aggregate's current
 * options, the same way the sibling questions/rulesets blocks in
 * `DrizzleVoteWriteRepository#save` already do. Options that legitimately
 * disappear from the aggregate are deleted (and, via
 * `ballot_answers.option_id ON DELETE CASCADE`, take any ballot answers
 * referencing them with them) — but that is only reachable while the vote
 * is still in DRAFT, before any ballots exist. Options that merely persist
 * unchanged, or get relabelled/reordered, must never be deleted and
 * re-inserted, or a save on an OPEN/CLOSED vote would cascade-delete every
 * ballot answer.
 */
export function planOptionPersistence(
  existingIds: string[],
  aggregateOptions: { id: string }[],
): OptionPersistencePlan {
  const existingIdSet = new Set(existingIds);
  const aggregateIdSet = new Set(aggregateOptions.map((o) => o.id));

  const toDelete = existingIds.filter((id) => !aggregateIdSet.has(id));
  const toUpdate = aggregateOptions
    .filter((o) => existingIdSet.has(o.id))
    .map((o) => o.id);
  const toInsert = aggregateOptions
    .filter((o) => !existingIdSet.has(o.id))
    .map((o) => o.id);

  return { toDelete, toUpdate, toInsert };
}
