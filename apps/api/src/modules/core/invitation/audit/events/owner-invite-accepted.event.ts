import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

const PayloadSchema = z.object({
  userId: z.uuid(),
  flow: z.enum(['EXISTING_USER', 'NEW_REGISTRATION']),
  labels: z.object({
    ownerName: z.string(),
    userName: z.string(),
  }),
});

export const OwnerInviteAcceptedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_INVITE_ACCEPTED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PUBLIC,
  tenantRequired: true,
  aggregateType: 'OWNER',
  entityType: null,
  build(input: {
    tenantId: string;
    ownerId: string;
    userId: string;
    flow: 'EXISTING_USER' | 'NEW_REGISTRATION';
    actor: AuditActor;
    ownerLabel: string;
    userLabel: string;
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
        flow: input.flow,
        labels: { ownerName: input.ownerLabel, userName: input.userLabel },
      },
    };
  },
});
