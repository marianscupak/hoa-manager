import { pgTable, uuid, numeric, boolean } from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/tenants';
import { voteOptions } from '@/infrastructure/db/schema/voting/vote-options';
import { voteQuestions } from '@/infrastructure/db/schema/voting/vote-questions';
import { voteResults } from '@/infrastructure/db/schema/voting/vote-results';

export const voteQuestionResults = pgTable('vote_question_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  voteResultId: uuid('vote_result_id')
    .notNull()
    .references(() => voteResults.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => voteQuestions.id, { onDelete: 'cascade' }),
  majorityMet: boolean('majority_met').notNull(),
  winningOptionId: uuid('winning_option_id').references(() => voteOptions.id, {
    onDelete: 'cascade',
  }),
  majorityThresholdValue: numeric('majority_threshold_value', {
    precision: 19,
    scale: 4,
  }),
  majorityDenominatorValue: numeric('majority_denominator_value', {
    precision: 19,
    scale: 4,
  }).notNull(),
});
