import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  type ElectorateUnit,
  OwningUnitStatus,
} from './vote.types';

/**
 * Which electorate the status is being derived from: the live preview a
 * DRAFT/SCHEDULED vote recomputes on every read, or the frozen snapshot
 * taken when the vote opened.
 */
export type ElectoratePhase = 'PREVIEW' | 'SNAPSHOT';

/**
 * Display status of one of a member's units, derived from the SAME resolved
 * electorate row the open-time snapshot is built from — before a vote opens
 * it is computed live by `resolveElectorateUnits`, afterwards it is read back
 * from the snapshot. Both paths must agree on who represents a unit, so this
 * mapping is the single place that turns a resolved row into a status.
 *
 * `isOwner` says whether this member holds a share of the unit. A member who
 * represents a unit without owning any of it votes as someone's proxy, which
 * reads differently from voting one's own unit.
 */
export function deriveOwningUnitStatus(input: {
  resolved: Pick<ElectorateUnit, 'eligibilityStatus' | 'ineligibleReason'>;
  /** The account that may cast for the unit right now (see the channel
   *  helpers); null when the representative has no account or nobody
   *  represents the unit. */
  channelMembershipId: string | null;
  membershipId: string;
  isOwner: boolean;
  hasVoted: boolean;
  phase: ElectoratePhase;
}): OwningUnitStatus {
  const { resolved } = input;

  if (resolved.eligibilityStatus === ElectorateEligibilityStatus.INELIGIBLE) {
    // Before the vote opens, a unit whose co-owners have not settled on a
    // representative can still be fixed by delegating; once the snapshot is
    // frozen it cannot. Every other reason is structural in both phases.
    return input.phase === 'PREVIEW' &&
      resolved.ineligibleReason === ElectorateIneligibleReason.NO_REPRESENTATIVE
      ? OwningUnitStatus.REQUIRES_DELEGATION
      : OwningUnitStatus.INELIGIBLE;
  }

  if (input.hasVoted) return OwningUnitStatus.VOTED;
  if (input.channelMembershipId === input.membershipId) {
    return input.isOwner ? OwningUnitStatus.READY : OwningUnitStatus.PROXY;
  }
  // Someone else represents the unit — a co-owner with the share majority, a
  // designated person (with or without an account), or a delegate.
  return OwningUnitStatus.DELEGATED;
}
