import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import { Rational } from '@/shared/domain/rational';

import { ownerRef, refKey, type RepresentativeRef } from './representative-ref';
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
  to: RepresentativeRef;
}

const HALF = Rational.from(1, 2);

/**
 * The consent list as it would look if `consent` were recorded, used to
 * preview the outcome before actually saving one.
 *
 * The grantor's existing consent for that unit is REPLACED rather than added
 * to: an owner can only ever back one candidate (a partial unique index keeps
 * one VALID consent per vote/unit/owner), and `resolveElectorateUnits` reads
 * consents into a per-owner set, so appending would silently give the owner
 * two votes' worth of support.
 */
export function applyHypotheticalConsent(
  consents: ElectorateConsentInput[],
  consent: ElectorateConsentInput,
): ElectorateConsentInput[] {
  return [
    ...consents.filter(
      (c) =>
        !(c.unitId === consent.unitId && c.fromOwnerId === consent.fromOwnerId),
    ),
    consent,
  ];
}

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
  // Which candidates each owner backs, by `unitId|ownerId`.
  const consentKeysByOwner = new Map<string, Set<string>>();
  // Every person a consent names, per unit, so a non-owner delegate is a candidate.
  const consentTargetsByUnit = new Map<
    string,
    Map<string, RepresentativeRef>
  >();
  for (const c of consents) {
    const key = refKey(c.to);
    const ownerKey = `${c.unitId}|${c.fromOwnerId}`;
    const set = consentKeysByOwner.get(ownerKey) ?? new Set<string>();
    set.add(key);
    consentKeysByOwner.set(ownerKey, set);
    const targets =
      consentTargetsByUnit.get(c.unitId) ??
      new Map<string, RepresentativeRef>();
    targets.set(key, c.to);
    consentTargetsByUnit.set(c.unitId, targets);
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
        representativeOwnerId: null,
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
        representativeOwnerId: null,
        representativeMembershipId: null,
        eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
        ineligibleReason: ElectorateIneligibleReason.ASSOCIATION_OWNED,
      };
    }

    // Candidates are people: every party member as an owner (whether or not
    // they have an account), plus everyone a consent names. No shortcut for
    // sole owners: self-support at 1/1 wins the scan below, and going through
    // it is what lets a sole owner delegate — self-support is suppressed once
    // they have consented to someone else.
    const candidates = new Map<string, RepresentativeRef>(
      consentTargetsByUnit.get(unit.id) ?? [],
    );
    for (const party of unitParties) {
      for (const m of party.members) {
        const ref = ownerRef(m.ownerId);
        candidates.set(refKey(ref), ref);
      }
    }

    const memberSupports = (
      m: { ownerId: string },
      candidateKey: string,
    ): boolean => {
      const ownerConsents = consentKeysByOwner.get(`${unit.id}|${m.ownerId}`);
      if (ownerConsents?.has(candidateKey)) return true;
      return (
        refKey(ownerRef(m.ownerId)) === candidateKey &&
        (!ownerConsents || ownerConsents.size === 0)
      );
    };

    // Relies on validateOwnershipPlan guaranteeing every party has >= 1 member
    // (SOLE = 1, SJM = 2); an empty members array would consent vacuously.
    const partyConsentsTo = (
      party: ElectoratePartyInput,
      candidateKey: string,
    ): boolean => party.members.every((m) => memberSupports(m, candidateKey));

    const winners: RepresentativeRef[] = [];
    for (const [key, ref] of candidates) {
      const consentedShare = Rational.sum(
        unitParties
          .filter((p) => partyConsentsTo(p, key))
          .map((p) => Rational.from(p.shareNumerator, p.shareDenominator)),
      );
      if (consentedShare.gt(HALF)) winners.push(ref);
    }

    const representative = winners.length === 1 ? winners[0] : null;
    if (representative) {
      return {
        ...base,
        representativeOwnerId: representative.ownerId,
        representativeMembershipId: representative.membershipId,
        eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
        ineligibleReason: null,
      };
    }
    return {
      ...base,
      representativeOwnerId: null,
      representativeMembershipId: null,
      eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
      ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
    };
  });
}
