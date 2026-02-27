import { Owner, Unit, UnitOwnership } from '../../domain/property.entity';

export interface UnitRepository {
  create(
    tenantId: string,
    unitNo: string,
    buildingShare: string,
  ): Promise<Unit>;
  findById(tenantId: string, unitId: string): Promise<Unit | null>;
  listByTenant(tenantId: string): Promise<Unit[]>;
}

export const UNIT_REPOSITORY = Symbol('UNIT_REPOSITORY');

export interface OwnerRepository {
  create(
    tenantId: string,
    displayName: string,
    userId: string | null,
  ): Promise<Owner>;
  existsById(tenantId: string, ownerId: string): Promise<boolean>;
  listByTenant(tenantId: string): Promise<Owner[]>;
}

export const OWNER_REPOSITORY = Symbol('OWNER_REPOSITORY');

export interface UnitOwnershipRepository {
  listActiveByUnit(tenantId: string, unitId: string): Promise<UnitOwnership[]>;
  closeActiveByUnit(tenantId: string, unitId: string, now: Date): Promise<void>;
  createMany(
    tenantId: string,
    unitId: string,
    rows: Array<{ ownerId: string; share: string }>,
    now: Date,
  ): Promise<UnitOwnership[]>;
}

export const UNIT_OWNERSHIP_REPOSITORY = Symbol('UNIT_OWNERSHIP_REPOSITORY');
