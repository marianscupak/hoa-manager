import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { providerEnum } from '@/infrastructure/db/schema/core/auth-identities';
import { users } from '@/infrastructure/db/schema/core/users';

/**
 * Why the round trip to the provider was started. A `LINK` attempt carries
 * the account it belongs to and may only ever attach an identity to it; the
 * column exists so a link attempt cannot be replayed into the sign-in branch.
 */
export const oidcPurposeEnum = pgEnum('oidc_purpose', ['LOGIN', 'LINK']);

export const oidcLoginAttempts = pgTable('oidc_login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: providerEnum('provider').notNull(),
  purpose: oidcPurposeEnum('purpose').notNull().default('LOGIN'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
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
