import type {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import type {
  Owner,
  UnitOwnershipParty,
} from '@/modules/core/property/domain/property.entity';
import { Rational } from '@/shared/domain/rational';

export interface UnitOwnershipDetailMember {
  ownerId: string;
  displayName: string;
  kind: OwnerKind;
}

export interface UnitOwnershipDetailItem {
  id: string;
  partyType: OwnershipPartyType;
  shareNumerator: number;
  shareDenominator: number;
  shareDecimal: string;
  members: UnitOwnershipDetailMember[];
}

/** Party row → API item, resolving member names from the tenant's owners. */
export function toOwnershipPartyItem(
  party: UnitOwnershipParty,
  ownersById: Map<string, Owner>,
): UnitOwnershipDetailItem {
  return {
    id: party.id,
    partyType: party.partyType,
    shareNumerator: party.shareNumerator,
    shareDenominator: party.shareDenominator,
    shareDecimal: Rational.from(
      party.shareNumerator,
      party.shareDenominator,
    ).toDecimalString(4),
    members: party.memberOwnerIds.map((ownerId) => {
      const owner = ownersById.get(ownerId);
      return {
        ownerId,
        displayName: owner?.displayName ?? '',
        kind: owner?.kind as OwnerKind,
      };
    }),
  };
}
