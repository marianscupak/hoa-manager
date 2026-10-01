import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  userId: z.uuid(),
  source: z.enum(['INVITE_ACCEPT', 'INVITE_REGISTER', 'DIRECT']),
  labels: z.object({
    ownerName: z.string(),
    userName: z.string(),
    linkedBy: z.string(),
  }),
});

export const OwnerUserLinkedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_USER_LINKED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'OWNER',
  entityType: null,
  build(input: {
    tenantId: string;
    ownerId: string;
    userId: string;
    source: 'INVITE_ACCEPT' | 'INVITE_REGISTER' | 'DIRECT';
    actor: AuditActor;
    ownerLabel: string;
    userLabel: string;
    linkedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.ownerId,
      entityId: null,
      payload: {
        userId: input.userId,
        source: input.source,
        labels: {
          ownerName: input.ownerLabel,
          userName: input.userLabel,
          linkedBy: input.linkedByLabel,
        },
      },
    };
  },
});
