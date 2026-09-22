import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  uuid,
  integer,
  unique,
  check,
} from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { units } from '@/infrastructure/db/schema/core/units';
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
    representativeOwnerId: uuid('representative_owner_id').references(
      () => owners.id,
      { onDelete: 'set null' },
    ),
    eligibilityStatus:
      electorateEligibilityStatusEnum('eligibility_status').notNull(),
    ineligibleReason: electorateIneligibleReasonEnum('ineligible_reason'),
    weightNumerator: integer('weight_numerator').notNull(),
    weightDenominator: integer('weight_denominator').notNull(),
    snapshottedAt: timestamp('snapshotted_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
  (table) => ({
    unqVoteElectorateUnitsVoteIdUnitId: unique(
      'unq_vote_electorate_units_vote_id_unit_id',
    ).on(table.voteId, table.unitId),
    chkOneRepresentative: check(
      'chk_vote_electorate_units_one_representative',
      sql`${table.representativeOwnerId} IS NULL OR ${table.representativeMembershipId} IS NULL`,
    ),
  }),
);
