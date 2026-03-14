import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { users } from '@/infrastructure/db/schema/core/users';

export const authExchangeCodes = pgTable('auth_exchange_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeHash: text('code_hash').notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, {
    onDelete: 'cascade',
  }),
  membershipId: uuid('membership_id').references(() => tenantMemberships.id, {
    onDelete: 'cascade',
  }),
  roles: jsonb('roles').$type<string[]>(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});
