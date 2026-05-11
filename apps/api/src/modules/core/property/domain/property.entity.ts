export interface Unit {
  id: string;
  tenantId: string;
  unitNo: string;
  buildingShareNumerator: number;
  buildingShareDenominator: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  tenantId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitOwnership {
  id: string;
  tenantId: string;
  unitId: string;
  ownerId: string;
  share: string;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
}
