import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  questionId: z.uuid(),
  labels: z.object({
    voteTitle: z.string(),
    questionTitle: z.string(),
    actor: z.string(),
  }),
});

export const VoteQuestionUpdatedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_QUESTION_UPDATED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: 'QUESTION',
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    questionId: string;
    questionTitle: string;
    actor: AuditActor;
    actorLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: input.questionId,
      payload: {
        questionId: input.questionId,
        labels: {
          voteTitle: input.voteTitle,
          questionTitle: input.questionTitle,
          actor: input.actorLabel,
        },
      },
    };
  },
});
