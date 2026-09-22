import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { owners } from '@/infrastructure/db/schema';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { units } from '@/infrastructure/db/schema/core/units';
import { users } from '@/infrastructure/db/schema/core/users';
import { voteElectorateUnits } from '@/infrastructure/db/schema/voting/vote-electorate-units';
import { Rational } from '@/shared/domain/rational';

const repOwners = alias(owners, 'rep_owners');

export interface ElectorateUnitSnapshot {
  unitId: string;
  unitLabel: string;
  representativeMembershipId: string | null;
  representativeOwnerId: string | null;
  representativeLabel: string | null;
  eligibilityStatus: string;
  ineligibleReason: string | null;
  /** Exact `"num/den"` fraction. */
  weight: string;
  weightDecimal: string;
}

export interface ElectorateSnapshotWithLabels {
  units: ElectorateUnitSnapshot[];
  totalUnits: number;
  /** Exact `"num/den"` fraction. */
  totalWeight: string;
  totalWeightDecimal: string;
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
        representativeOwnerId: voteElectorateUnits.representativeOwnerId,
        representativeFullName: users.fullName,
        representativeOwnerName: repOwners.displayName,
        eligibilityStatus: voteElectorateUnits.eligibilityStatus,
        ineligibleReason: voteElectorateUnits.ineligibleReason,
        weightNumerator: voteElectorateUnits.weightNumerator,
        weightDenominator: voteElectorateUnits.weightDenominator,
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
      .leftJoin(
        repOwners,
        eq(repOwners.id, voteElectorateUnits.representativeOwnerId),
      )
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
        ),
      );

    const weights = rows.map((r) =>
      Rational.from(r.weightNumerator, r.weightDenominator),
    );

    const unitsMapped: ElectorateUnitSnapshot[] = rows.map((r, i) => ({
      unitId: r.unitId,
      unitLabel: r.unitNo,
      representativeMembershipId: r.representativeMembershipId,
      representativeOwnerId: r.representativeOwnerId,
      representativeLabel:
        r.representativeOwnerName ?? r.representativeFullName ?? null,
      eligibilityStatus: r.eligibilityStatus,
      ineligibleReason: r.ineligibleReason,
      weight: `${weights[i].num}/${weights[i].den}`,
      weightDecimal: weights[i].toDecimalString(4),
    }));

    const totalWeight = Rational.sum(weights);

    return {
      units: unitsMapped,
      totalUnits: unitsMapped.length,
      totalWeight: `${totalWeight.num}/${totalWeight.den}`,
      totalWeightDecimal: totalWeight.toDecimalString(4),
    };
  }
}
