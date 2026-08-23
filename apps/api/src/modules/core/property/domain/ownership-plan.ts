import { Rational } from '@/shared/domain/rational';

export enum OwnerKind {
  PERSON = 'PERSON',
  LEGAL_ENTITY = 'LEGAL_ENTITY',
  ASSOCIATION = 'ASSOCIATION',
}

export enum OwnershipPartyType {
  SOLE = 'SOLE',
  SJM = 'SJM',
}

export interface OwnershipPartyInput {
  partyType: OwnershipPartyType;
  shareNumerator: number;
  shareDenominator: number;
  memberOwnerIds: string[];
}

export interface OwnerRef {
  id: string;
  kind: OwnerKind;
}

export type OwnershipPlanError =
  | { code: 'INVALID_SHARE'; index: number }
  | { code: 'SUM_NOT_ONE'; actual: { num: string; den: string } }
  | { code: 'SOLE_MEMBER_COUNT'; index: number }
  | { code: 'SJM_MEMBER_RULES'; index: number }
  | { code: 'DUPLICATE_OWNER'; ownerId: string }
  | { code: 'MIXED_ASSOCIATION' }
  | { code: 'UNKNOWN_OWNER'; ownerId: string };

const isValidFraction = (num: number, den: number): boolean =>
  Number.isInteger(num) && Number.isInteger(den) && num > 0 && den > 0 && num <= den;

export function validateOwnershipPlan(
  parties: OwnershipPartyInput[],
  owners: Map<string, OwnerRef>,
): OwnershipPlanError[] {
  const errors: OwnershipPlanError[] = [];
  const seenOwners = new Set<string>();
  let hasAssociationParty = false;

  parties.forEach((party, index) => {
    // Check fraction validity
    if (!isValidFraction(party.shareNumerator, party.shareDenominator)) {
      errors.push({ code: 'INVALID_SHARE', index });
    }

    // Map owner IDs to refs, tracking unknown owners
    const members = party.memberOwnerIds
      .map((id) => owners.get(id) ?? null)
      .map((ref, i) => {
        if (ref === null) {
          errors.push({ code: 'UNKNOWN_OWNER', ownerId: party.memberOwnerIds[i] });
        }
        return ref;
      })
      .filter((ref): ref is OwnerRef => ref !== null);

    // Check party-type-specific rules before checking duplicates
    if (party.partyType === OwnershipPartyType.SOLE) {
      if (party.memberOwnerIds.length !== 1) {
        errors.push({ code: 'SOLE_MEMBER_COUNT', index });
      }
    } else {
      const distinct = new Set(party.memberOwnerIds);
      const allPersons =
        members.length === party.memberOwnerIds.length &&
        members.every((m) => m.kind === OwnerKind.PERSON);
      if (party.memberOwnerIds.length !== 2 || distinct.size !== 2 || !allPersons) {
        errors.push({ code: 'SJM_MEMBER_RULES', index });
      }
    }

    // Check for cross-party duplicates using deduplicated member IDs (intra-party repeats are caught by party-type rules)
    const distinctMemberIds = new Set(party.memberOwnerIds);
    for (const id of distinctMemberIds) {
      if (seenOwners.has(id)) {
        errors.push({ code: 'DUPLICATE_OWNER', ownerId: id });
      }
      seenOwners.add(id);
    }

    // Track if any party has an association
    if (members.some((m) => m.kind === OwnerKind.ASSOCIATION)) {
      hasAssociationParty = true;
    }
  });

  if (hasAssociationParty && parties.length > 1) {
    errors.push({ code: 'MIXED_ASSOCIATION' });
  }

  if (errors.length > 0) return errors;

  const total = Rational.sum(
    parties.map((p) => Rational.from(p.shareNumerator, p.shareDenominator)),
  );
  if (!total.eq(Rational.one())) {
    errors.push({ code: 'SUM_NOT_ONE', actual: total.toJSON() });
  }

  return errors;
}
