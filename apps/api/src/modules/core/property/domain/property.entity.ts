import type {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';

export interface Unit {
  id: string;
  tenantId: string;
  unitNo: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
  katastrUnitId: string | null;
  usageCode: string | null;
  usageName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  tenantId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  kind: OwnerKind;
  katastrPersonId: string | null;
  ico: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitOwnershipParty {
  id: string;
  tenantId: string;
  unitId: string;
  partyType: OwnershipPartyType;
  shareNumerator: number;
  shareDenominator: number;
  validFrom: Date;
  validTo: Date | null;
  memberOwnerIds: string[];
}
