import { pgTable, timestamp, uuid, text, unique } from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { units } from '@/infrastructure/db/schema/core/units';
import { ballotCastMethodEnum } from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const ballots = pgTable(
  'ballots',
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
    castByMembershipId: uuid('cast_by_membership_id')
      .notNull()
      .references(() => tenantMemberships.id, { onDelete: 'cascade' }),
    attributionOwnerId: uuid('attribution_owner_id').references(
      () => owners.id,
      {
        onDelete: 'cascade',
      },
    ),
    castMethod: ballotCastMethodEnum('cast_method').notNull(),
    evidenceNote: text('evidence_note'),
    castAt: timestamp('cast_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    unqBallotsVoteIdUnitId: unique('unq_ballots_vote_id_unit_id').on(
      table.voteId,
      table.unitId,
    ),
  }),
);
