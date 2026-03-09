import { pgTable, timestamp, uuid, unique } from 'drizzle-orm/pg-core';

import { ballots } from '@/infrastructure/db/schema/voting/ballots';
import { voteOptions } from '@/infrastructure/db/schema/voting/vote-options';
import { voteQuestions } from '@/infrastructure/db/schema/voting/vote-questions';

export const ballotAnswers = pgTable(
  'ballot_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ballotId: uuid('ballot_id')
      .notNull()
      .references(() => ballots.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => voteQuestions.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => voteOptions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    unqBallotAnswersBallotIdQuestionId: unique(
      'unq_ballot_answers_ballot_id_question_id',
    ).on(table.ballotId, table.questionId),
  }),
);
