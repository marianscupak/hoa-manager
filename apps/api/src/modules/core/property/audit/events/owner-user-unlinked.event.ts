import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

const PayloadSchema = z.object({
  userId: z.uuid(),
  labels: z.object({
    ownerName: z.string(),
    userName: z.string(),
    unlinkedBy: z.string(),
  }),
});

/**
 * The counterpart of `OwnerUserLinkedAuditEvent`.
 *
 * Removing the link takes away the account's right to act for that owner's
 * units, which is as consequential as granting it — so it is logged the same
 * way. No `source`: unlinking only ever happens because somebody clicked it.
 */
export const OwnerUserUnlinkedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_USER_UNLINKED,
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
    actor: AuditActor;
    ownerLabel: string;
    userLabel: string;
    unlinkedByLabel: string;
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
        labels: {
          ownerName: input.ownerLabel,
          userName: input.userLabel,
          unlinkedBy: input.unlinkedByLabel,
        },
      },
    };
  },
});
