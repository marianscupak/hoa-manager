import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { VotingEventType } from '../voting-event-types';

const QuestionOutcomeSchema = z.object({
  questionId: z.uuid(),
  majorityMet: z.boolean(),
  winningOptionId: z.uuid().nullable(),
});

const LabeledQuestionSchema = z.object({
  questionText: z.string(),
  winningOptionText: z.string().nullable(),
});

const PayloadSchema = z.object({
  /** `null` for per-rollam votes, which have no quorum by law. */
  quorumReached: z.boolean().nullable(),
  questions: z.array(QuestionOutcomeSchema),
  labels: z.object({
    voteTitle: z.string(),
    questions: z.array(LabeledQuestionSchema),
  }),
});

export const VoteResultsComputedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_RESULTS_COMPUTED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PUBLIC,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: null,
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    actor: AuditActor;
    quorumReached: boolean | null;
    questions: {
      questionId: string;
      majorityMet: boolean;
      winningOptionId: string | null;
    }[];
    labeledQuestions: {
      questionText: string;
      winningOptionText: string | null;
    }[];
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        quorumReached: input.quorumReached,
        questions: input.questions,
        labels: {
          voteTitle: input.voteTitle,
          questions: input.labeledQuestions,
        },
      },
    };
  },
});
