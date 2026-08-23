import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  uuid,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { units } from '@/infrastructure/db/schema/core/units';
import { voteUnitConsentStatusEnum } from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const voteUnitConsents = pgTable(
  'vote_unit_consents',
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
    fromOwnerId: uuid('from_owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    toMembershipId: uuid('to_membership_id')
      .notNull()
      .references(() => tenantMemberships.id, { onDelete: 'cascade' }),
    recordedByMembershipId: uuid('recorded_by_membership_id').references(
      () => tenantMemberships.id,
      { onDelete: 'cascade' },
    ),
    status: voteUnitConsentStatusEnum('status').notNull(),
    evidenceNote: text('evidence_note'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    unqValidConsent: uniqueIndex('unq_vote_unit_consents_valid')
      .on(table.voteId, table.unitId, table.fromOwnerId)
      .where(sql`${table.status} = 'VALID'`),
  }),
);
