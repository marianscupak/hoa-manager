import { pgTable, uuid, numeric, integer } from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { voteOptions } from '@/infrastructure/db/schema/voting/vote-options';
import { voteQuestionResults } from '@/infrastructure/db/schema/voting/vote-question-results';

export const voteOptionResults = pgTable('vote_option_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  questionResultId: uuid('question_result_id')
    .notNull()
    .references(() => voteQuestionResults.id, { onDelete: 'cascade' }),
  optionId: uuid('option_id')
    .notNull()
    .references(() => voteOptions.id, { onDelete: 'cascade' }),
  voteWeight: numeric('vote_weight', { precision: 19, scale: 4 }).notNull(),
  voteUnitCount: integer('vote_unit_count').notNull(),
});
