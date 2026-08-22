import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { units } from '@/infrastructure/db/schema/core/units';
import { users } from '@/infrastructure/db/schema/core/users';
import { voteElectorateUnits } from '@/infrastructure/db/schema/voting/vote-electorate-units';

export interface ElectorateUnitSnapshot {
  unitId: string;
  unitLabel: string;
  representativeMembershipId: string | null;
  representativeLabel: string | null;
  eligibilityStatus: string;
  ineligibleReason: string | null;
  weight: number;
}

export interface ElectorateSnapshotWithLabels {
  units: ElectorateUnitSnapshot[];
  totalUnits: number;
  totalWeight: number;
}

@Injectable()
export class VoteElectorateSnapshotLookup {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async findSnapshotWithLabels(
    tenantId: string,
    voteId: string,
  ): Promise<ElectorateSnapshotWithLabels> {
    const rows = await this.db
      .select({
        unitId: voteElectorateUnits.unitId,
        unitNo: units.unitNo,
        representativeMembershipId:
          voteElectorateUnits.representativeMembershipId,
        representativeFullName: users.fullName,
        eligibilityStatus: voteElectorateUnits.eligibilityStatus,
        ineligibleReason: voteElectorateUnits.ineligibleReason,
        votingWeight: voteElectorateUnits.votingWeight,
      })
      .from(voteElectorateUnits)
      .innerJoin(units, eq(voteElectorateUnits.unitId, units.id))
      .leftJoin(
        tenantMemberships,
        eq(
          tenantMemberships.id,
          voteElectorateUnits.representativeMembershipId,
        ),
      )
      .leftJoin(users, eq(users.id, tenantMemberships.userId))
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
        ),
      );

    const unitsMapped: ElectorateUnitSnapshot[] = rows.map((r) => ({
      unitId: r.unitId,
      unitLabel: r.unitNo,
      representativeMembershipId: r.representativeMembershipId,
      representativeLabel: r.representativeFullName ?? null,
      eligibilityStatus: r.eligibilityStatus,
      ineligibleReason: r.ineligibleReason,
      weight: Number(r.votingWeight),
    }));

    const totalWeight = unitsMapped.reduce((sum, u) => sum + u.weight, 0);

    return {
      units: unitsMapped,
      totalUnits: unitsMapped.length,
      totalWeight,
    };
  }
}
