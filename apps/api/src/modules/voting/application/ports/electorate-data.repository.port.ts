export interface ElectorateUnitData {
  id: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
}

export interface ElectorateOwnershipData {
  unitId: string;
  ownerId: string;
  membershipId: string | null;
}

export interface ElectorateConsentData {
  unitId: string;
  fromOwnerId: string;
  toMembershipId: string;
}

export interface ElectorateDataRepository {
  findAllUnits(tenantId: string): Promise<ElectorateUnitData[]>;
  findOwnershipRecords(tenantId: string): Promise<ElectorateOwnershipData[]>;
  findValidConsents(
    tenantId: string,
    voteId: string,
  ): Promise<ElectorateConsentData[]>;
}

export const ELECTORATE_DATA_REPOSITORY = Symbol('ELECTORATE_DATA_REPOSITORY');
