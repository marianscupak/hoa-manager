import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  presentCount: z.number().int(),
  absentCount: z.number().int(),
  quorumMet: z.boolean().nullable(),
  labels: z.object({
    voteTitle: z.string(),
    publishedBy: z.string(),
  }),
});

/**
 * Publishing an assembly record closes the vote, computes the result and
 * reveals both to owners in one irreversible step.
 *
 * One event rather than the usual VOTE_CLOSED + VOTE_RESULTS_COMPUTED pair:
 * for this mode those describe the same act, and "the record was published" is
 * what actually happened. This one is TENANT_PUBLIC because it is the moment
 * owners are meant to learn the vote exists.
 */
export const AssemblyRecordPublishedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.ASSEMBLY_RECORD_PUBLISHED,
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
    presentCount: number;
    absentCount: number;
    quorumMet: boolean | null;
    actor: AuditActor;
    publishedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        presentCount: input.presentCount,
        absentCount: input.absentCount,
        quorumMet: input.quorumMet,
        labels: {
          voteTitle: input.voteTitle,
          publishedBy: input.publishedByLabel,
        },
      },
    };
  },
});
