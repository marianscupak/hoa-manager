import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { users } from '@/infrastructure/db/schema/core/users';

export const ownerKindEnum = pgEnum('owner_kind', [
  'PERSON',
  'LEGAL_ENTITY',
  'ASSOCIATION',
]);

export const owners = pgTable(
  'owners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    kind: ownerKindEnum('kind').notNull().default('PERSON'),
    katastrPersonId: text('katastr_person_id'),
    ico: text('ico'),
    email: text('email'),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueTenantUser: unique('owners_tenant_user_unique').on(
      table.tenantId,
      table.userId,
    ),
    uniqueTenantEmail: unique('owners_tenant_email_unique').on(
      table.tenantId,
      table.email,
    ),
    uniqueTenantKatastrPerson: unique(
      'owners_tenant_katastr_person_id_unique',
    ).on(table.tenantId, table.katastrPersonId),
  }),
);
