import { pgTable, timestamp, uuid, text, unique } from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { units } from '@/infrastructure/db/schema/core/units';
import { voteAttendanceStatusEnum } from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

/**
 * Who was represented at an assembly, as the board recorded it.
 *
 * Working state for the recording session, deliberately NOT an input to the
 * tally: the publish gate requires every present unit to have a ballot, so at
 * publish "present" and "has a ballot" are the same set, and `tally.ts`
 * already counts quorum and the majority denominator from ballots. Feeding
 * this in as well would create a second source of truth for one fact.
 *
 * ABSENT rows are stored rather than inferred, because the roster has to tell
 * "the board said absent" apart from "the board has not reached this unit".
 */
export const voteAttendance = pgTable(
  'vote_attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    voteId: uuid('vote_id')
      .notNull()
      .references(() => votes.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    status: voteAttendanceStatusEnum('status').notNull(),
    // The entitled voter, when they are an owner on record.
    voterOwnerId: uuid('voter_owner_id').references(() => owners.id, {
      onDelete: 'set null',
    }),
    // A proxy holder who is not an owner — provenance only, never authority.
    // Whether the unit may vote at all is decided by the electorate, not here.
    voterNote: text('voter_note'),
    recordedByMembershipId: uuid('recorded_by_membership_id')
      .notNull()
      .references(() => tenantMemberships.id, { onDelete: 'cascade' }),
    recordedAt: timestamp('recorded_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueVoteUnit: unique('vote_attendance_vote_unit_unique').on(
      table.voteId,
      table.unitId,
    ),
  }),
);
