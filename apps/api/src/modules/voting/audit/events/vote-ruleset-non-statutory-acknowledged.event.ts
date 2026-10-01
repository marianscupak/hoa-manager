import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  deviations: z.array(z.enum(['ONE_UNIT_ONE_VOTE', 'UNIT_COUNT_QUORUM'])),
  labels: z.object({
    voteTitle: z.string(),
    acknowledgedBy: z.string(),
  }),
});

export const VoteRulesetNonStatutoryAcknowledgedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_RULESET_NON_STATUTORY_ACKNOWLEDGED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: null,
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    deviations: ('ONE_UNIT_ONE_VOTE' | 'UNIT_COUNT_QUORUM')[];
    actor: AuditActor;
    acknowledgedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        deviations: input.deviations,
        labels: {
          voteTitle: input.voteTitle,
          acknowledgedBy: input.acknowledgedByLabel,
        },
      },
    };
  },
});
