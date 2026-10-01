import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  documentId: z.uuid(),
  labels: z.object({
    voteTitle: z.string(),
    fileName: z.string(),
    actor: z.string(),
  }),
});

export const VoteDocumentRemovedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_DOCUMENT_REMOVED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: 'DOCUMENT',
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    documentId: string;
    fileName: string;
    actor: AuditActor;
    actorLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: input.documentId,
      payload: {
        documentId: input.documentId,
        labels: {
          voteTitle: input.voteTitle,
          fileName: input.fileName,
          actor: input.actorLabel,
        },
      },
    };
  },
});
