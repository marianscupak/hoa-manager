import { pgTable, timestamp, uuid, text, index } from 'drizzle-orm/pg-core';

import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { voteStatusEnum } from '@/infrastructure/db/schema/voting/enums';

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    createdByMembershipId: uuid('created_by_membership_id')
      .notNull()
      .references(() => tenantMemberships.id),
    openedByMembershipId: uuid('opened_by_membership_id').references(
      () => tenantMemberships.id,
    ),
    closedByMembershipId: uuid('closed_by_membership_id').references(
      () => tenantMemberships.id,
    ),
    title: text('title').notNull(),
    description: text('description'),
    status: voteStatusEnum('status').notNull().default('DRAFT'),
    scheduledFrom: timestamp('scheduled_from', {
      withTimezone: true,
      mode: 'date',
    }),
    scheduledTo: timestamp('scheduled_to', {
      withTimezone: true,
      mode: 'date',
    }),
    openedAt: timestamp('opened_at', { withTimezone: true, mode: 'date' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    idxVotesStatusScheduledFrom: index('idx_votes_status_scheduled_from').on(
      table.status,
      table.scheduledFrom,
    ),
    idxVotesStatusScheduledTo: index('idx_votes_status_scheduled_to').on(
      table.status,
      table.scheduledTo,
    ),
  }),
);
