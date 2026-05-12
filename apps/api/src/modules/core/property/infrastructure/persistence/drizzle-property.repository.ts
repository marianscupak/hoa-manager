import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { owners, unitOwnerships, units } from '@/infrastructure/db/schema';
import {
  OwnerRepository,
  UnitOwnershipRepository,
  UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import {
  Owner,
  Unit,
  UnitOwnership,
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
  ): Promise<Owner> {
    const [inserted] = await this.db
      .insert(owners)
      .values({
        tenantId,
        displayName,
        userId,
        email,
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
  ): Promise<UnitOwnership[]> {
    return this.db.query.unitOwnerships.findMany({
      where: and(
        eq(unitOwnerships.tenantId, tenantId),
        eq(unitOwnerships.unitId, unitId),
        isNull(unitOwnerships.validTo),
      ),
    });
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
    rows: Array<{ ownerId: string; share: string }>,
    now: Date,
  ): Promise<UnitOwnership[]> {
    if (rows.length === 0) return [];

    const values = rows.map((row) => ({
      tenantId,
      unitId,
      ownerId: row.ownerId,
      share: row.share,
      validFrom: now,
    }));

    return this.db.insert(unitOwnerships).values(values).returning();
  }
}
