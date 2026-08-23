import { pgTable, uuid, bigint, integer } from 'drizzle-orm/pg-core';

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
  voteWeightNum: bigint('vote_weight_num', { mode: 'bigint' }).notNull(),
  voteWeightDen: bigint('vote_weight_den', { mode: 'bigint' }).notNull(),
  voteUnitCount: integer('vote_unit_count').notNull(),
});
