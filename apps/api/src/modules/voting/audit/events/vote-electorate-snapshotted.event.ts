import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { FractionSchema } from './_shared.schemas';
import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  totalUnits: z.number().int().nonnegative(),
  totalWeight: FractionSchema,
  labels: z.object({
    voteTitle: z.string(),
  }),
});

export const VoteElectorateSnapshottedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_ELECTORATE_SNAPSHOTTED,
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
    totalUnits: number;
    totalWeight: { numerator: number; denominator: number };
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        totalUnits: input.totalUnits,
        totalWeight: input.totalWeight,
        labels: {
          voteTitle: input.voteTitle,
        },
      },
    };
  },
});
