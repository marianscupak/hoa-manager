import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { providerEnum } from '@/infrastructure/db/schema/core/auth-identities';

export const oidcLoginAttempts = pgTable('oidc_login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: providerEnum('provider').notNull(),
  stateHash: text('state_hash').notNull().unique(),
  nonce: text('nonce').notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});
