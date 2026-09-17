import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { voteAttendance } from '@/infrastructure/db/schema/voting/vote-attendance';
import {
  type AttendanceRow,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';

@Injectable()
export class DrizzleVoteAttendanceRepository
  implements VoteAttendanceRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async upsert(
    tenantId: string,
    voteId: string,
    row: AttendanceRow & { recordedByMembershipId: string },
  ): Promise<void> {
    await this.db
      .insert(voteAttendance)
      .values({
        tenantId,
        voteId,
        unitId: row.unitId,
        status: row.status,
        voterOwnerId: row.voterOwnerId,
        voterNote: row.voterNote,
        recordedByMembershipId: row.recordedByMembershipId,
      })
      .onConflictDoUpdate({
        target: [voteAttendance.voteId, voteAttendance.unitId],
        set: {
          status: row.status,
          voterOwnerId: row.voterOwnerId,
          voterNote: row.voterNote,
          recordedByMembershipId: row.recordedByMembershipId,
        },
      });
  }

  async findByVote(tenantId: string, voteId: string): Promise<AttendanceRow[]> {
    const rows = await this.db
      .select({
        unitId: voteAttendance.unitId,
        status: voteAttendance.status,
        voterOwnerId: voteAttendance.voterOwnerId,
        voterNote: voteAttendance.voterNote,
      })
      .from(voteAttendance)
      .where(
        and(
          eq(voteAttendance.tenantId, tenantId),
          eq(voteAttendance.voteId, voteId),
        ),
      );

    return rows;
  }
}
