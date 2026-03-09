import { pgTable, timestamp, uuid, numeric, unique } from 'drizzle-orm/pg-core';

import { tenantMemberships } from '@/infrastructure/db/schema/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/tenants';
import { units } from '@/infrastructure/db/schema/units';
import {
  electorateEligibilityStatusEnum,
  electorateIneligibleReasonEnum,
} from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const voteElectorateUnits = pgTable(
  'vote_electorate_units',
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
    representativeMembershipId: uuid('representative_membership_id').references(
      () => tenantMemberships.id,
      { onDelete: 'cascade' },
    ),
    eligibilityStatus:
      electorateEligibilityStatusEnum('eligibility_status').notNull(),
    ineligibleReason: electorateIneligibleReasonEnum('ineligible_reason'),
    votingWeight: numeric('voting_weight', {
      precision: 19,
      scale: 4,
    }).notNull(),
    snapshottedAt: timestamp('snapshotted_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
  (table) => ({
    unqVoteElectorateUnitsVoteIdUnitId: unique(
      'unq_vote_electorate_units_vote_id_unit_id',
    ).on(table.voteId, table.unitId),
  }),
);
