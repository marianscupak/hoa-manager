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
  /** Parties active at `now` — pass the same instant stored as `snapshottedAt`. */
  findOwnershipParties(
    tenantId: string,
    now: Date,
  ): Promise<ElectorateOwnershipPartyData[]>;
  findValidConsents(
    tenantId: string,
    voteId: string,
  ): Promise<ElectorateConsentData[]>;
  /** Start of the earliest ownership period on record, or null if there is
   *  none. An assembly held before this cannot be read literally — see
   *  `assemblyElectorateAsOf`. */
  findOwnershipRegisterStart(tenantId: string): Promise<Date | null>;
}

export const ELECTORATE_DATA_REPOSITORY = Symbol('ELECTORATE_DATA_REPOSITORY');
