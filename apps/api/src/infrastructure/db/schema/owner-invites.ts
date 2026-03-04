import { pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core';

import { owners } from '@/infrastructure/db/schema/owners';
import { tenants } from '@/infrastructure/db/schema/tenants';
import { users } from '@/infrastructure/db/schema/users';

export const ownerInvites = pgTable(
  'owner_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    emailNormalized: text('email_normalized').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    unqOwnerPending: unique('unq_owner_invite_owner').on(
      table.tenantId,
      table.ownerId,
    ),
  }),
);
