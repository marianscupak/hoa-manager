import { Injectable } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import {
  owners,
  unitOwnershipMembers,
  unitOwnerships,
  units,
} from '@/infrastructure/db/schema';
import type { KatastrSnapshotRepository } from '@/modules/core/property/application/ports/katastr-snapshot.repository.port';
import type {
  RegisterSnapshot,
  RegisterUnit,
} from '@/modules/core/property/domain/katastr/import-plan';
import type { OwnerKind } from '@/modules/core/property/domain/ownership-plan';
import type { UnitOwnershipParty } from '@/modules/core/property/domain/property.entity';

@Injectable()
export class DrizzleKatastrSnapshotRepository
  implements KatastrSnapshotRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async lockTenant(tenantId: string): Promise<void> {
    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtext(${tenantId}))`,
    );
  }

  async load(tenantId: string): Promise<RegisterSnapshot> {
    // Ordered explicitly, matching drizzle-property.repository.ts's own
    // listByTenant/listActiveByUnit methods: Postgres gives no ordering
    // guarantee absent ORDER BY, and buildImportPlan's derived arrays are
    // sorted assuming a stable read — this is the read half of that
    // guarantee, not a substitute for it. `unit_no` is already unique per
    // tenant (units_tenant_unit_no_unique), so `id` is appended defensively
    // here rather than because a tie is reachable today — the remaining
    // half of the two orderings Task 7 deliberately left for this task.
    const unitRows = await this.db
      .select()
      .from(units)
      .where(eq(units.tenantId, tenantId))
      .orderBy(units.unitNo, units.id);

    // Unlike unit_no, owners.display_name carries no uniqueness guarantee at
    // all — two owner rows can share a display name, or (independently of
    // this ordering) an IČO that buildImportPlan looks up by — so `id` is
    // not defensive here: without it this query has no total order.
    const ownerRows = await this.db
      .select()
      .from(owners)
      .where(eq(owners.tenantId, tenantId))
      .orderBy(owners.displayName, owners.id);

    // unitId + validFrom is not unique: every replace-unit-ownership write
    // gives all the parties it creates an identical validFrom, so a unit with
    // two or more concurrent parties (a routine shape, not an edge case) has
    // ties on those two columns alone. `id` — the row's own primary key — is
    // the unique final tie-breaker; an ORDER BY without one is not really an
    // ordering. (buildImportPlan re-sorts `existing.parties` by id again
    // before building the display summary the admin sees, so this read-side
    // ordering is the other half of that guarantee, not a substitute for it.)
    const partyRows = await this.db
      .select()
      .from(unitOwnerships)
      .where(eq(unitOwnerships.tenantId, tenantId))
      .orderBy(
        unitOwnerships.unitId,
        unitOwnerships.validFrom,
        unitOwnerships.id,
      );

    const memberRows =
      partyRows.length === 0
        ? []
        : await this.db
            .select()
            .from(unitOwnershipMembers)
            .where(
              inArray(
                unitOwnershipMembers.ownershipId,
                partyRows.map((p: { id: string }) => p.id),
              ),
            )
            // (ownershipId, ownerId) is already unique (unq_unit_ownership_
            // members_ownership_owner), so this pair alone has no ties; `id`
            // is appended anyway to match the same "always end on the row's
            // own id" pattern as the ownerships query above.
            .orderBy(
              unitOwnershipMembers.ownershipId,
              unitOwnershipMembers.ownerId,
              unitOwnershipMembers.id,
            );

    const membersByParty = new Map<string, string[]>();
    for (const row of memberRows) {
      membersByParty.set(row.ownershipId, [
        ...(membersByParty.get(row.ownershipId) ?? []),
        row.ownerId,
      ]);
    }

    const partiesByUnit = new Map<string, UnitOwnershipParty[]>();
    for (const row of partyRows) {
      const party: UnitOwnershipParty = {
        id: row.id,
        tenantId: row.tenantId,
        unitId: row.unitId,
        partyType: row.partyType,
        shareNumerator: row.shareNumerator,
        shareDenominator: row.shareDenominator,
        validFrom: row.validFrom,
        validTo: row.validTo,
        memberOwnerIds: membersByParty.get(row.id) ?? [],
      };
      partiesByUnit.set(row.unitId, [
        ...(partiesByUnit.get(row.unitId) ?? []),
        party,
      ]);
    }

    const snapshotUnits: RegisterUnit[] = unitRows.map(
      (u: {
        id: string;
        unitNo: string;
        katastrUnitId: string | null;
        buildingShareNumerator: number;
        buildingShareDenominator: number;
        usageCode: string | null;
        usageName: string | null;
      }) => ({
        id: u.id,
        unitNo: u.unitNo,
        katastrUnitId: u.katastrUnitId,
        buildingShare: {
          num: BigInt(u.buildingShareNumerator),
          den: BigInt(u.buildingShareDenominator),
        },
        usageCode: u.usageCode,
        usageName: u.usageName,
        parties: partiesByUnit.get(u.id) ?? [],
      }),
    );

    return {
      units: snapshotUnits,
      owners: ownerRows.map(
        (o: {
          id: string;
          displayName: string;
          kind: OwnerKind;
          email: string | null;
          userId: string | null;
          katastrPersonId: string | null;
          ico: string | null;
        }) => ({
          id: o.id,
          displayName: o.displayName,
          kind: o.kind,
          email: o.email,
          hasAccount: o.userId !== null,
          katastrPersonId: o.katastrPersonId,
          ico: o.ico,
        }),
      ),
    };
  }
}
