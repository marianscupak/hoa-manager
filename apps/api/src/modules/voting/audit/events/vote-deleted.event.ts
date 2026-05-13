import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  labels: z.object({
    voteTitle: z.string(),
    deletedBy: z.string(),
  }),
});

export const VoteDeletedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_DELETED,
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
    actor: AuditActor;
    deletedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        labels: {
          voteTitle: input.voteTitle,
          deletedBy: input.deletedByLabel,
        },
      },
    };
  },
});
