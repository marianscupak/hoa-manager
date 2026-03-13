import { pgTable, timestamp, uuid, text, integer } from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/tenants';
import { voteQuestions } from '@/infrastructure/db/schema/voting/vote-questions';

export const voteOptions = pgTable(
  'vote_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => voteQuestions.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    optionKey: text('option_key').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (_table) => ({}),
);
