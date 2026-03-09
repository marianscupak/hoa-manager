import {
  pgTable,
  timestamp,
  uuid,
  text,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/tenants';
import { questionTypeEnum } from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const voteQuestions = pgTable(
  'vote_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    voteId: uuid('vote_id')
      .notNull()
      .references(() => votes.id, { onDelete: 'cascade' }),
    questionType: questionTypeEnum('question_type').notNull(),
    title: text('title').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    unqVoteQuestionsVoteIdSortOrder: unique(
      'unq_vote_questions_vote_id_sort_order',
    ).on(table.voteId, table.sortOrder),
  }),
);
