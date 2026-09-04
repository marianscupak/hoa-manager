import type {
  OwnerKind,
  OwnershipPartyInput,
} from '@/modules/core/property/domain/ownership-plan';
import {
  Owner,
  Unit,
  UnitOwnershipParty,
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
  /**
   * Row lock on the unit for the current transaction (SELECT … FOR UPDATE).
   * Serialises concurrent ownership writes so the one-scheduled-period rule
   * cannot be raced by two admins saving at once.
   */
  lockForUpdate(tenantId: string, unitId: string): Promise<void>;
}

export const UNIT_REPOSITORY = Symbol('UNIT_REPOSITORY');

export interface OwnerRepository {
  create(
    tenantId: string,
    displayName: string,
    userId: string | null,
    email: string | null,
    kind: OwnerKind,
  ): Promise<Owner>;
  findById(tenantId: string, ownerId: string): Promise<Owner | null>;
  findByEmail(tenantId: string, email: string): Promise<Owner | null>;
  existsById(tenantId: string, ownerId: string): Promise<boolean>;
  existsAssociationOwner(tenantId: string): Promise<boolean>;
  listByTenant(tenantId: string): Promise<Owner[]>;
  setUserId(tenantId: string, ownerId: string, userId: string): Promise<void>;
  setEmail(tenantId: string, ownerId: string, email: string): Promise<void>;
  delete(tenantId: string, ownerId: string): Promise<void>;
}

export const OWNER_REPOSITORY = Symbol('OWNER_REPOSITORY');

export interface UnitOwnershipRepository {
  /** Parties holding the unit at `now` (see `ownershipActiveAt`). */
  listActiveByUnit(
    tenantId: string,
    unitId: string,
    now: Date,
  ): Promise<UnitOwnershipParty[]>;
  /** Every party of the unit, past, current and scheduled, oldest first. */
  listByUnit(tenantId: string, unitId: string): Promise<UnitOwnershipParty[]>;
  /** True when the membership's owner record appears in any party of the unit. */
  hasEverOwnedUnit(
    tenantId: string,
    unitId: string,
    membershipId: string,
  ): Promise<boolean>;
  /** Any `unit_ownership_members` row for the owner, in any period. */
  existsMemberRowForOwner(tenantId: string, ownerId: string): Promise<boolean>;
  /** Ids of every owner referenced by at least one party, for list flags. */
  listReferencedOwnerIds(tenantId: string): Promise<Set<string>>;
  closeParties(tenantId: string, partyIds: string[], at: Date): Promise<void>;
  reopenParties(tenantId: string, partyIds: string[]): Promise<void>;
  deleteParties(tenantId: string, partyIds: string[]): Promise<void>;
  createMany(
    tenantId: string,
    unitId: string,
    parties: OwnershipPartyInput[],
    validFrom: Date,
  ): Promise<void>;
}

export const UNIT_OWNERSHIP_REPOSITORY = Symbol('UNIT_OWNERSHIP_REPOSITORY');
