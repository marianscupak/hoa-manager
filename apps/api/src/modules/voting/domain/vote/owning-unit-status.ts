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
 * Display status of one of an owner's units, derived from the SAME resolved
 * electorate row the open-time snapshot is built from — before a vote opens
 * it is computed live by `resolveElectorateUnits`, afterwards it is read back
 * from the snapshot. Both paths must agree on who represents a unit, so this
 * mapping is the single place that turns a resolved row into a status.
 */
export function deriveOwningUnitStatus(input: {
  resolved: Pick<
    ElectorateUnit,
    'representativeMembershipId' | 'eligibilityStatus' | 'ineligibleReason'
  >;
  membershipId: string;
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
  if (resolved.representativeMembershipId === input.membershipId) {
    return OwningUnitStatus.READY;
  }
  // Someone else represents the unit — either because this owner delegated
  // to them, or because they hold a share majority of the unit.
  return OwningUnitStatus.DELEGATED;
}
