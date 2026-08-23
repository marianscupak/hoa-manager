import {
  pgTable,
  timestamp,
  uuid,
  bigint,
  boolean,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

import { tenants } from '@/infrastructure/db/schema/core/tenants';
import { voteResultStatusEnum } from '@/infrastructure/db/schema/voting/enums';
import { votes } from '@/infrastructure/db/schema/voting/votes';

export const voteResults = pgTable(
  'vote_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    voteId: uuid('vote_id')
      .notNull()
      .references(() => votes.id, { onDelete: 'cascade' }),
    resultStatus: voteResultStatusEnum('result_status').notNull(),
    quorumMet: boolean('quorum_met'),
    participationWeightNum: bigint('participation_weight_num', {
      mode: 'bigint',
    }).notNull(),
    participationWeightDen: bigint('participation_weight_den', {
      mode: 'bigint',
    }).notNull(),
    participationUnitCount: integer('participation_unit_count').notNull(),
    totalVotesWeightNum: bigint('total_votes_weight_num', {
      mode: 'bigint',
    }).notNull(),
    totalVotesWeightDen: bigint('total_votes_weight_den', {
      mode: 'bigint',
    }).notNull(),
    totalVotesUnitCount: integer('total_votes_unit_count').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    unqVoteResultsVoteId: unique('unq_vote_results_vote_id').on(table.voteId),
  }),
);
