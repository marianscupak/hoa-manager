import { pgTable, timestamp, uuid, pgEnum, unique } from 'drizzle-orm/pg-core';

import { tenants } from './tenants';
import { users } from './users';

export const roleEnum = pgEnum('role', [
  'ADMIN',
  'BOARD_MEMBER',
  'AUDITOR',
  'UNIT_OWNER',
]);
export const statusEnum = pgEnum('status', ['ACTIVE', 'SUSPENDED', 'INVITED']);

export const tenantMemberships = pgTable(
  'tenant_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    status: statusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    unqTenantUser: unique('unq_tenant_user').on(table.tenantId, table.userId),
  }),
);
