import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  labels: z.object({
    voteTitle: z.string(),
    createdBy: z.string(),
  }),
});

export const VoteCreatedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_CREATED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: null,
  build(input: {
    voteId: string;
    tenantId: string;
    title: string;
    description: string | null;
    actor: AuditActor;
    createdByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        title: input.title,
        description: input.description,
        labels: {
          voteTitle: input.title,
          createdBy: input.createdByLabel,
        },
      },
    };
  },
});
