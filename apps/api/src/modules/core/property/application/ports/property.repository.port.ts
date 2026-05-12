import {
  Owner,
  Unit,
  UnitOwnership,
} from '@/modules/core/property/domain/property.entity';

export interface UnitRepository {
  create(
    tenantId: string,
    unitNo: string,
    buildingShareNumerator: number,
    buildingShareDenominator: number,
  ): Promise<Unit>;
  update(
    tenantId: string,
    unitId: string,
    unitNo: string,
    buildingShareNumerator: number,
    buildingShareDenominator: number,
  ): Promise<Unit>;
  findById(tenantId: string, unitId: string): Promise<Unit | null>;
  listByTenant(tenantId: string): Promise<Unit[]>;
  delete(tenantId: string, unitId: string): Promise<void>;
}

export const UNIT_REPOSITORY = Symbol('UNIT_REPOSITORY');

export interface OwnerRepository {
  create(
    tenantId: string,
    displayName: string,
    userId: string | null,
    email: string | null,
  ): Promise<Owner>;
  findById(tenantId: string, ownerId: string): Promise<Owner | null>;
  findByEmail(tenantId: string, email: string): Promise<Owner | null>;
  existsById(tenantId: string, ownerId: string): Promise<boolean>;
  listByTenant(tenantId: string): Promise<Owner[]>;
  setUserId(tenantId: string, ownerId: string, userId: string): Promise<void>;
  delete(tenantId: string, ownerId: string): Promise<void>;
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
