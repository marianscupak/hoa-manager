import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  owners,
  ownershipActiveAt,
  tenantMemberships,
  unitOwnershipMembers,
  unitOwnerships,
  units,
} from '@/infrastructure/db/schema';
import {
  CreateOwnerInput,
  CreateUnitInput,
  OwnerRepository,
  UnitOwnershipRepository,
  UnitRepository,
  UpdateUnitInput,
} from '@/modules/core/property/application/ports/property.repository.port';
import {
  OwnershipPartyInput,
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

  async create(tenantId: string, input: CreateUnitInput): Promise<Unit> {
    const [inserted] = await this.db
      .insert(units)
      .values({
        tenantId,
        unitNo: input.unitNo,
        buildingShareNumerator: input.buildingShareNumerator,
        buildingShareDenominator: input.buildingShareDenominator,
        katastrUnitId: input.katastrUnitId ?? null,
        usageCode: input.usageCode ?? null,
        usageName: input.usageName ?? null,
      })
      .returning();
    return inserted;
  }

  async update(
    tenantId: string,
    unitId: string,
    input: UpdateUnitInput,
  ): Promise<Unit> {
    const [updated] = await this.db
      .update(units)
      .set({
        unitNo: input.unitNo,
        buildingShareNumerator: input.buildingShareNumerator,
        buildingShareDenominator: input.buildingShareDenominator,
        ...(input.katastrUnitId === undefined
          ? {}
          : { katastrUnitId: input.katastrUnitId }),
        ...(input.usageCode === undefined
          ? {}
          : { usageCode: input.usageCode }),
        ...(input.usageName === undefined
          ? {}
          : { usageName: input.usageName }),
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

  async lockForUpdate(tenantId: string, unitId: string): Promise<void> {
    await this.db
      .select({ id: units.id })
      .from(units)
      .where(and(eq(units.tenantId, tenantId), eq(units.id, unitId)))
      .for('update');
  }
}

@Injectable()
export class DrizzleOwnerRepository implements OwnerRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async create(tenantId: string, input: CreateOwnerInput): Promise<Owner> {
    const [inserted] = await this.db
      .insert(owners)
      .values({
        tenantId,
        displayName: input.displayName,
        userId: input.userId,
        email: input.email,
        kind: input.kind,
        katastrPersonId: input.katastrPersonId ?? null,
        ico: input.ico ?? null,
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

  async clearUserId(tenantId: string, ownerId: string): Promise<void> {
    await this.db
      .update(owners)
      .set({ userId: null })
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

  async setDisplayName(
    tenantId: string,
    ownerId: string,
    displayName: string,
  ): Promise<void> {
    await this.db
      .update(owners)
      .set({ displayName })
      .where(and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)));
  }

  async setKatastrPersonId(
    tenantId: string,
    ownerId: string,
    katastrPersonId: string,
    ico: string | null,
  ): Promise<void> {
    await this.db
      .update(owners)
      .set({ katastrPersonId, ...(ico === null ? {} : { ico }) })
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
    now: Date,
  ): Promise<UnitOwnershipParty[]> {
    const parties = await this.db.query.unitOwnerships.findMany({
      where: and(
        eq(unitOwnerships.tenantId, tenantId),
        eq(unitOwnerships.unitId, unitId),
        ownershipActiveAt(now),
      ),
    });
    return this.attachMembers(parties);
  }

  async listActiveOwnerIdsByTenant(
    tenantId: string,
    now: Date,
  ): Promise<{ unitId: string; ownerId: string }[]> {
    return await this.db
      .select({
        unitId: unitOwnerships.unitId,
        ownerId: unitOwnershipMembers.ownerId,
      })
      .from(unitOwnerships)
      .innerJoin(
        unitOwnershipMembers,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .where(
        and(eq(unitOwnerships.tenantId, tenantId), ownershipActiveAt(now)),
      );
  }

  private async attachMembers(
    parties: (typeof unitOwnerships.$inferSelect)[],
  ): Promise<UnitOwnershipParty[]> {
    if (parties.length === 0) return [];

    const partyIds = parties.map((p) => p.id);
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

    return parties.map((party) => ({
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

  /** Every party of the unit, past, current and scheduled, oldest first. */
  async listByUnit(
    tenantId: string,
    unitId: string,
  ): Promise<UnitOwnershipParty[]> {
    const parties = await this.db.query.unitOwnerships.findMany({
      where: and(
        eq(unitOwnerships.tenantId, tenantId),
        eq(unitOwnerships.unitId, unitId),
      ),
      orderBy: (t: typeof unitOwnerships.$inferSelect, { asc }: any) => [
        asc(t.validFrom),
      ],
    });
    return this.attachMembers(parties);
  }

  async hasEverOwnedUnit(
    tenantId: string,
    unitId: string,
    membershipId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: unitOwnershipMembers.id })
      .from(unitOwnershipMembers)
      .innerJoin(
        unitOwnerships,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .innerJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.userId, owners.userId),
          eq(tenantMemberships.tenantId, owners.tenantId),
        ),
      )
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.unitId, unitId),
          eq(tenantMemberships.id, membershipId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async existsMemberRowForOwner(
    tenantId: string,
    ownerId: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: unitOwnershipMembers.id })
      .from(unitOwnershipMembers)
      .where(
        and(
          eq(unitOwnershipMembers.tenantId, tenantId),
          eq(unitOwnershipMembers.ownerId, ownerId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async listReferencedOwnerIds(tenantId: string): Promise<Set<string>> {
    const rows = await this.db
      .selectDistinct({ ownerId: unitOwnershipMembers.ownerId })
      .from(unitOwnershipMembers)
      .where(eq(unitOwnershipMembers.tenantId, tenantId));
    return new Set(rows.map((r: { ownerId: string }) => r.ownerId));
  }

  async setPeriodBounds(
    tenantId: string,
    partyIds: string[],
    validFrom: Date,
    validTo: Date | null,
  ): Promise<void> {
    if (partyIds.length === 0) return;
    await this.db
      .update(unitOwnerships)
      .set({ validFrom, validTo })
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.id, partyIds),
        ),
      );
  }

  async closeParties(
    tenantId: string,
    partyIds: string[],
    at: Date,
  ): Promise<void> {
    if (partyIds.length === 0) return;
    await this.db
      .update(unitOwnerships)
      .set({ validTo: at })
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.id, partyIds),
        ),
      );
  }

  async reopenParties(tenantId: string, partyIds: string[]): Promise<void> {
    if (partyIds.length === 0) return;
    await this.db
      .update(unitOwnerships)
      .set({ validTo: null })
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.id, partyIds),
        ),
      );
  }

  /** Member rows go with the party (`unit_ownership_members.ownership_id` cascades). */
  async deleteParties(tenantId: string, partyIds: string[]): Promise<void> {
    if (partyIds.length === 0) return;
    await this.db
      .delete(unitOwnerships)
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.id, partyIds),
        ),
      );
  }

  async createMany(
    tenantId: string,
    unitId: string,
    parties: OwnershipPartyInput[],
    validFrom: Date,
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
          validFrom,
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
