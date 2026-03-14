import {
  pgTable,
  timestamp,
  uuid,
  numeric,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';
import {
  majorityRuleTypeEnum,
  quorumElectorateBasisEnum,
  quorumMeasureEnum,
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
    quorumMeasure: quorumMeasureEnum('quorum_measure').notNull(),
    quorumElectorateBasis: quorumElectorateBasisEnum(
      'quorum_electorate_basis',
    ).notNull(),
    quorumThreshold: numeric('quorum_threshold', {
      precision: 19,
      scale: 4,
    }).notNull(),
    majorityRuleType: majorityRuleTypeEnum('majority_rule_type').notNull(),
    majorityThreshold: numeric('majority_threshold', {
      precision: 19,
      scale: 4,
    }),
    allowAbstain: boolean('allow_abstain').notNull(),
    abstainExcludedFromMajorityDenominator: boolean(
      'abstain_excluded_from_majority_denominator',
    ).notNull(),
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
