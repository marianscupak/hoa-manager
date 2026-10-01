import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  scheduledFrom: z.string().datetime({ offset: true }),
  scheduledTo: z.string().datetime({ offset: true }),
  labels: z.object({
    voteTitle: z.string(),
    scheduledBy: z.string(),
  }),
});

export const VoteScheduledAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_SCHEDULED,
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
    scheduledFrom: Date;
    scheduledTo: Date;
    actor: AuditActor;
    scheduledByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        scheduledFrom: input.scheduledFrom.toISOString(),
        scheduledTo: input.scheduledTo.toISOString(),
        labels: {
          voteTitle: input.voteTitle,
          scheduledBy: input.scheduledByLabel,
        },
      },
    };
  },
});
