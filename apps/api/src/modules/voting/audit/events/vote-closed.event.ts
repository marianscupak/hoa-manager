import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  closedAt: z.string().datetime(),
  labels: z.object({
    voteTitle: z.string(),
    closedBy: z.string(),
  }),
});

export const VoteClosedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_CLOSED,
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
    closedByLabel: string;
    closedAt: Date;
  }) {
    return {
      occurredAt: input.closedAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        closedAt: input.closedAt.toISOString(),
        labels: {
          voteTitle: input.voteTitle,
          closedBy: input.closedByLabel,
        },
      },
    };
  },
});
