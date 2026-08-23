import {
  pgTable,
  timestamp,
  uuid,
  integer,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';
import {
  majorityDenominatorBasisEnum,
  majorityRuleTypeEnum,
  quorumMeasureEnum,
  thresholdComparatorEnum,
  voteWeightBasisEnum,
} from '@/infrastructure/db/schema/voting/enums';
import { voteQuestions } from '@/infrastructure/db/schema/voting/vote-questions';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const voteRulesets = pgTable(
  'vote_rulesets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    voteId: uuid('vote_id')
      .notNull()
      .references(() => votes.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').references(() => voteQuestions.id, {
      onDelete: 'cascade',
    }),
    weightBasis: voteWeightBasisEnum('weight_basis').notNull(),
    quorumMeasure: quorumMeasureEnum('quorum_measure'),
    quorumThresholdNum: integer('quorum_threshold_num'),
    quorumThresholdDen: integer('quorum_threshold_den'),
    quorumComparator: thresholdComparatorEnum('quorum_comparator'),
    majorityRuleType: majorityRuleTypeEnum('majority_rule_type').notNull(),
    majorityDenominatorBasis: majorityDenominatorBasisEnum(
      'majority_denominator_basis',
    ).notNull(),
    majorityThresholdNum: integer('majority_threshold_num').notNull(),
    majorityThresholdDen: integer('majority_threshold_den').notNull(),
    majorityComparator: thresholdComparatorEnum(
      'majority_comparator',
    ).notNull(),
    allowAbstain: boolean('allow_abstain').notNull(),
    acknowledgedNonStatutory: boolean('acknowledged_non_statutory')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    unqVoteRulesetsVoteIdQuestionId: unique(
      'unq_vote_rulesets_vote_id_question_id',
    ).on(table.voteId, table.questionId),
  }),
);
