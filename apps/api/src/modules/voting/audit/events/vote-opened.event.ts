import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  openedAt: z.string().datetime({ offset: true }),
  electorateSize: z.number().int().nonnegative(),
  labels: z.object({
    voteTitle: z.string(),
    openedBy: z.string(),
  }),
});

export const VoteOpenedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_OPENED,
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
    openedByLabel: string;
    electorateSize: number;
    openedAt: Date;
  }) {
    return {
      occurredAt: input.openedAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        openedAt: input.openedAt.toISOString(),
        electorateSize: input.electorateSize,
        labels: {
          voteTitle: input.voteTitle,
          openedBy: input.openedByLabel,
        },
      },
    };
  },
});
