import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';

import { users } from './users';

export const providerEnum = pgEnum('provider', ['LOCAL', 'OIDC_GOOGLE']);

export const authIdentities = pgTable(
  'auth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: providerEnum('provider').notNull(),
    providerSubject: text('provider_subject').notNull(),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    unqProviderSubject: unique('unq_provider_subject').on(
      table.provider,
      table.providerSubject,
    ),
  }),
);
