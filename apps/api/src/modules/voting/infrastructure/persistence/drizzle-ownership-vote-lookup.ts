import { Injectable } from '@nestjs/common';
import { eq, exists } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { voteElectorateUnits, votes } from '@/infrastructure/db/schema';
import type { OwnershipVoteLookup } from '@/modules/core/property/application/ports/ownership-vote-lookup.port';
import type { VoteInRange } from '@/modules/core/property/domain/ownership-period-bounds';

/**
 * Voting's answer to the register's OwnershipVoteLookup port. It lives here so
 * that only the voting module knows its own tables; the register depends on
 * the port alone and receives this implementation through VotingPortsModule.
 */
@Injectable()
export class DrizzleOwnershipVoteLookup implements OwnershipVoteLookup {
  constructor(private readonly drizzle: DrizzleService) {}

  async findVotes(tenantId: string): Promise<VoteInRange[]> {
    const rows = await this.drizzle.db
      .select({
        voteId: votes.id,
        title: votes.title,
        mode: votes.mode,
        scheduledFrom: votes.scheduledFrom,
        openedAt: votes.openedAt,
        // An electorate row exists once the vote froze its own — at open for
        // per rollam, at publication for an assembly record.
        published: exists(
          this.drizzle.db
            .select({ one: voteElectorateUnits.voteId })
            .from(voteElectorateUnits)
            .where(eq(voteElectorateUnits.voteId, votes.id)),
        ),
      })
      .from(votes)
      .where(eq(votes.tenantId, tenantId));

    return rows.flatMap((row) => {
      // An assembly record is written up after the meeting, so its date is
      // the one the electorate is read at; a per-rollam vote freezes when it
      // opens, and before that its window start is what it will use.
      const relevantAt =
        row.mode === 'ASSEMBLY_RECORD'
          ? row.scheduledFrom
          : row.openedAt ?? row.scheduledFrom;
      if (!relevantAt) return [];
      return [
        {
          voteId: row.voteId,
          title: row.title,
          mode: row.mode as VoteInRange['mode'],
          published: Boolean(row.published),
          relevantAt,
        },
      ];
    });
  }
}
