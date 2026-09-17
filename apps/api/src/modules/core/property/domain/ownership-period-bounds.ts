/**
 * Rules for moving the bounds of an ownership period that is already on the
 * register, and for telling the board which votes a move reaches.
 *
 * A period is the half-open interval `[validFrom, validTo)`; a null
 * `validTo` means it is still open. Two periods that meet exactly — one
 * ending where the next begins — share no instant and do not overlap.
 */

export interface PeriodBounds {
  validFrom: Date;
  validTo: Date | null;
}

export type PeriodBoundsIssue = 'END_BEFORE_START' | 'OVERLAPS_ANOTHER_PERIOD';

const END_OF_TIME = Number.POSITIVE_INFINITY;
const endOf = (bounds: PeriodBounds): number =>
  bounds.validTo?.getTime() ?? END_OF_TIME;

const overlaps = (a: PeriodBounds, b: PeriodBounds): boolean =>
  a.validFrom.getTime() < endOf(b) && b.validFrom.getTime() < endOf(a);

/**
 * Checks proposed bounds against the unit's other periods. `others` must not
 * include the period being moved.
 */
export function validatePeriodBounds(
  target: PeriodBounds,
  others: PeriodBounds[],
): PeriodBoundsIssue | null {
  if (target.validTo !== null && endOf(target) <= target.validFrom.getTime()) {
    return 'END_BEFORE_START';
  }
  if (others.some((other) => overlaps(target, other))) {
    return 'OVERLAPS_ANOTHER_PERIOD';
  }
  return null;
}

export interface VoteInRange {
  voteId: string;
  title: string;
  mode: 'PER_ROLLAM' | 'ASSEMBLY_RECORD';
  /** Whether the vote's electorate and results are already snapshotted. */
  published: boolean;
  /** Meeting date for an assembly record, otherwise when the vote opened. */
  relevantAt: Date;
}

/**
 * `LIVE` — the vote still reads the register, so moving a period moves who
 * may vote; already-entered ballots can be left stranded.
 * `FROZEN` — the electorate and the result were snapshotted, so nothing
 * recomputes; the register and the snapshot simply stop agreeing.
 */
export type VoteImpact = 'LIVE' | 'FROZEN';

export interface AffectedVote extends VoteInRange {
  impact: VoteImpact;
}

export function classifyVotesInRange(
  range: { from: Date; to: Date | null },
  votes: VoteInRange[],
): AffectedVote[] {
  const from = range.from.getTime();
  const to = range.to?.getTime() ?? END_OF_TIME;

  return votes
    .filter((vote) => {
      const at = vote.relevantAt.getTime();
      return at >= from && at < to;
    })
    .map((vote) => ({
      ...vote,
      impact: vote.published ? ('FROZEN' as const) : ('LIVE' as const),
    }));
}
