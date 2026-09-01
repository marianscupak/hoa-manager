import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import { Rational } from '@/shared/domain/rational';

import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  type ElectorateUnit,
  VoteWeightBasis,
} from './vote.types';

export interface ElectorateUnitInput {
  id: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
}

export interface ElectoratePartyInput {
  unitId: string;
  partyType: OwnershipPartyType;
  shareNumerator: number;
  shareDenominator: number;
  members: {
    ownerId: string;
    ownerKind: OwnerKind;
    membershipId: string | null;
  }[];
}

export interface ElectorateConsentInput {
  unitId: string;
  fromOwnerId: string;
  toMembershipId: string;
}

const HALF = Rational.from(1, 2);

export function resolveElectorateUnits(
  units: ElectorateUnitInput[],
  parties: ElectoratePartyInput[],
  consents: ElectorateConsentInput[],
  weightBasis: VoteWeightBasis,
): ElectorateUnit[] {
  const partiesByUnit = new Map<string, ElectoratePartyInput[]>();
  for (const party of parties) {
    const list = partiesByUnit.get(party.unitId) ?? [];
    list.push(party);
    partiesByUnit.set(party.unitId, list);
  }
  const consentsByOwner = new Map<string, Set<string>>();
  for (const c of consents) {
    const key = `${c.unitId}|${c.fromOwnerId}`;
    const set = consentsByOwner.get(key) ?? new Set<string>();
    set.add(c.toMembershipId);
    consentsByOwner.set(key, set);
  }
  const consentTargetsByUnit = new Map<string, Set<string>>();
  for (const c of consents) {
    const set = consentTargetsByUnit.get(c.unitId) ?? new Set<string>();
    set.add(c.toMembershipId);
    consentTargetsByUnit.set(c.unitId, set);
  }

  return units.map((unit) => {
    const weight =
      weightBasis === VoteWeightBasis.ONE_UNIT_ONE_VOTE
        ? Rational.one()
        : Rational.from(
            unit.buildingShareNumerator,
            unit.buildingShareDenominator,
          );
    const base = {
      unitId: unit.id,
      weightNum: Number(weight.num),
      weightDen: Number(weight.den),
    };

    const unitParties = partiesByUnit.get(unit.id) ?? [];
    if (unitParties.length === 0) {
      return {
        ...base,
        representativeMembershipId: null,
        eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
        ineligibleReason: ElectorateIneligibleReason.MISSING_OWNERSHIP,
      };
    }

    const isAssociationOwned = unitParties.some((p) =>
      p.members.some((m) => m.ownerKind === OwnerKind.ASSOCIATION),
    );
    if (isAssociationOwned) {
      return {
        ...base,
        representativeMembershipId: null,
        eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
        ineligibleReason: ElectorateIneligibleReason.ASSOCIATION_OWNED,
      };
    }

    // No shortcut for sole owners: the candidate scan below already covers
    // them (with no consent, self is the only candidate and holds 1/1 > 1/2),
    // and going through it is what lets a sole owner delegate — self-support
    // is suppressed once they have consented to someone else.
    const candidates = new Set<string>(consentTargetsByUnit.get(unit.id) ?? []);
    for (const party of unitParties) {
      for (const m of party.members) {
        if (m.membershipId) candidates.add(m.membershipId);
      }
    }

    const memberSupports = (
      m: { ownerId: string; membershipId: string | null },
      candidate: string,
    ): boolean => {
      const ownerConsents = consentsByOwner.get(`${unit.id}|${m.ownerId}`);
      if (ownerConsents?.has(candidate)) return true;
      return (
        m.membershipId === candidate &&
        (!ownerConsents || ownerConsents.size === 0)
      );
    };

    // Relies on validateOwnershipPlan guaranteeing every party has >= 1 member
    // (SOLE = 1, SJM = 2); an empty members array would consent vacuously.
    const partyConsentsTo = (
      party: ElectoratePartyInput,
      candidate: string,
    ): boolean => party.members.every((m) => memberSupports(m, candidate));

    const winners: string[] = [];
    for (const candidate of candidates) {
      const consentedShare = Rational.sum(
        unitParties
          .filter((p) => partyConsentsTo(p, candidate))
          .map((p) => Rational.from(p.shareNumerator, p.shareDenominator)),
      );
      if (consentedShare.gt(HALF)) {
        winners.push(candidate);
      }
    }

    const representative = winners.length === 1 ? winners[0] : null;

    if (representative) {
      return {
        ...base,
        representativeMembershipId: representative,
        eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
        ineligibleReason: null,
      };
    }
    return {
      ...base,
      representativeMembershipId: null,
      eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
      ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
    };
  });
}
