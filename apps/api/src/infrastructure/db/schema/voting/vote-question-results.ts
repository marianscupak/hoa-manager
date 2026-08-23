import { pgTable, uuid, bigint, boolean, integer } from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { thresholdComparatorEnum } from '@/infrastructure/db/schema/voting/enums';
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
  majorityThresholdNum: integer('majority_threshold_num').notNull(),
  majorityThresholdDen: integer('majority_threshold_den').notNull(),
  majorityComparator: thresholdComparatorEnum('majority_comparator').notNull(),
  majorityDenominatorNum: bigint('majority_denominator_num', {
    mode: 'bigint',
  }).notNull(),
  majorityDenominatorDen: bigint('majority_denominator_den', {
    mode: 'bigint',
  }).notNull(),
});
