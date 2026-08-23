import {
  type OwnerKind,
  type OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

export interface ElectorateUnitData {
  id: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
}

export interface ElectorateOwnershipPartyData {
  ownershipId: string;
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

export interface ElectorateConsentData {
  unitId: string;
  fromOwnerId: string;
  toMembershipId: string;
}

export interface ElectorateDataRepository {
  findAllUnits(tenantId: string): Promise<ElectorateUnitData[]>;
  findOwnershipParties(
    tenantId: string,
  ): Promise<ElectorateOwnershipPartyData[]>;
  findValidConsents(
    tenantId: string,
    voteId: string,
  ): Promise<ElectorateConsentData[]>;
}

export const ELECTORATE_DATA_REPOSITORY = Symbol('ELECTORATE_DATA_REPOSITORY');
