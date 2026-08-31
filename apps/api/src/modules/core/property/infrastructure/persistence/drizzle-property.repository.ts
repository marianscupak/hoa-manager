import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  owners,
  unitOwnershipMembers,
  unitOwnerships,
  units,
} from '@/infrastructure/db/schema';
import {
  OwnerRepository,
  UnitOwnershipRepository,
  UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import {
  OwnershipPartyInput,
  type OwnerKind,
  type OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import {
  Owner,
  Unit,
  UnitOwnershipParty,
} from '@/modules/core/property/domain/property.entity';

@Injectable()
export class DrizzleUnitRepository implements UnitRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async create(
    tenantId: string,
    unitNo: string,
    buildingShareNumerator: number,
    buildingShareDenominator: number,
  ): Promise<Unit> {
    const [inserted] = await this.db
      .insert(units)
      .values({
        tenantId,
        unitNo,
        buildingShareNumerator,
        buildingShareDenominator,
      })
      .returning();
    return inserted;
  }

  async update(
    tenantId: string,
    unitId: string,
    unitNo: string,
    buildingShareNumerator: number,
    buildingShareDenominator: number,
  ): Promise<Unit> {
    const [updated] = await this.db
      .update(units)
      .set({
        unitNo,
        buildingShareNumerator,
        buildingShareDenominator,
      })
      .where(and(eq(units.tenantId, tenantId), eq(units.id, unitId)))
      .returning();
    return updated;
  }

  async findById(tenantId: string, unitId: string): Promise<Unit | null> {
    const row = await this.db.query.units.findFirst({
      where: and(eq(units.tenantId, tenantId), eq(units.id, unitId)),
    });
    return row ?? null;
  }

  async listByTenant(tenantId: string): Promise<Unit[]> {
    return this.db.query.units.findMany({
      where: eq(units.tenantId, tenantId),
      orderBy: (t: typeof units.$inferSelect, { asc }: any) => [asc(t.unitNo)],
    });
  }

  async delete(tenantId: string, unitId: string): Promise<void> {
    await this.db
      .delete(units)
      .where(and(eq(units.tenantId, tenantId), eq(units.id, unitId)));
  }
}

@Injectable()
export class DrizzleOwnerRepository implements OwnerRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async create(
    tenantId: string,
    displayName: string,
    userId: string | null,
    email: string | null,
    kind: OwnerKind,
  ): Promise<Owner> {
    const [inserted] = await this.db
      .insert(owners)
      .values({
        tenantId,
        displayName,
        userId,
        email,
        kind,
      })
      .returning();
    return inserted;
  }

  async findById(tenantId: string, ownerId: string): Promise<Owner | null> {
    const row = await this.db.query.owners.findFirst({
      where: and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)),
    });
    return row ?? null;
  }

  async findByEmail(tenantId: string, email: string): Promise<Owner | null> {
    const row = await this.db.query.owners.findFirst({
      where: and(eq(owners.tenantId, tenantId), eq(owners.email, email)),
    });
    return row ?? null;
  }

  async existsById(tenantId: string, ownerId: string): Promise<boolean> {
    const row = await this.db.query.owners.findFirst({
      where: and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)),
      columns: { id: true },
    });
    return !!row;
  }

  async existsAssociationOwner(tenantId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: owners.id })
      .from(owners)
      .where(and(eq(owners.tenantId, tenantId), eq(owners.kind, 'ASSOCIATION')))
      .limit(1);
    return rows.length > 0;
  }

  async listByTenant(tenantId: string): Promise<Owner[]> {
    return this.db.query.owners.findMany({
      where: eq(owners.tenantId, tenantId),
      orderBy: (t: typeof owners.$inferSelect, { asc }: any) => [
        asc(t.displayName),
      ],
    });
  }

  async setUserId(
    tenantId: string,
    ownerId: string,
    userId: string,
  ): Promise<void> {
    await this.db
      .update(owners)
      .set({ userId })
      .where(and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)));
  }

  async setEmail(
    tenantId: string,
    ownerId: string,
    email: string,
  ): Promise<void> {
    await this.db
      .update(owners)
      .set({ email })
      .where(and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)));
  }

  async delete(tenantId: string, ownerId: string): Promise<void> {
    await this.db
      .delete(owners)
      .where(and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)));
  }
}

@Injectable()
export class DrizzleUnitOwnershipRepository implements UnitOwnershipRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async listActiveByUnit(
    tenantId: string,
    unitId: string,
  ): Promise<UnitOwnershipParty[]> {
    const parties = await this.db.query.unitOwnerships.findMany({
      where: and(
        eq(unitOwnerships.tenantId, tenantId),
        eq(unitOwnerships.unitId, unitId),
        isNull(unitOwnerships.validTo),
      ),
    });
    if (parties.length === 0) return [];

    const partyIds = parties.map(
      (p: typeof unitOwnerships.$inferSelect) => p.id,
    );
    const memberRows = await this.db
      .select({
        ownershipId: unitOwnershipMembers.ownershipId,
        ownerId: unitOwnershipMembers.ownerId,
      })
      .from(unitOwnershipMembers)
      .where(inArray(unitOwnershipMembers.ownershipId, partyIds));

    const membersByParty = new Map<string, string[]>();
    for (const row of memberRows) {
      const existing = membersByParty.get(row.ownershipId) ?? [];
      existing.push(row.ownerId);
      membersByParty.set(row.ownershipId, existing);
    }

    return parties.map((party: typeof unitOwnerships.$inferSelect) => ({
      id: party.id,
      tenantId: party.tenantId,
      unitId: party.unitId,
      partyType: party.partyType as OwnershipPartyType,
      shareNumerator: party.shareNumerator,
      shareDenominator: party.shareDenominator,
      validFrom: party.validFrom,
      validTo: party.validTo,
      memberOwnerIds: membersByParty.get(party.id) ?? [],
    }));
  }

  async closeActiveByUnit(
    tenantId: string,
    unitId: string,
    now: Date,
  ): Promise<void> {
    await this.db
      .update(unitOwnerships)
      .set({ validTo: now })
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.unitId, unitId),
          isNull(unitOwnerships.validTo),
        ),
      );
  }

  async createMany(
    tenantId: string,
    unitId: string,
    parties: OwnershipPartyInput[],
    now: Date,
  ): Promise<void> {
    for (const party of parties) {
      const [row] = await this.db
        .insert(unitOwnerships)
        .values({
          tenantId,
          unitId,
          partyType: party.partyType,
          shareNumerator: party.shareNumerator,
          shareDenominator: party.shareDenominator,
          validFrom: now,
        })
        .returning({ id: unitOwnerships.id });
      await this.db.insert(unitOwnershipMembers).values(
        party.memberOwnerIds.map((ownerId) => ({
          tenantId,
          ownershipId: row.id,
          ownerId,
        })),
      );
    }
  }
}
