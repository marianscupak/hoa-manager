import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  displayName: z.string(),
  hasEmail: z.boolean(),
  linkedToUserId: z.uuid().nullable(),
  labels: z.object({
    ownerName: z.string(),
    createdBy: z.string(),
  }),
});

export const OwnerCreatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_CREATED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'OWNER',
  entityType: null,
  build(input: {
    tenantId: string;
    ownerId: string;
    displayName: string;
    hasEmail: boolean;
    linkedToUserId: string | null;
    actor: AuditActor;
    createdByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.ownerId,
      entityId: null,
      payload: {
        displayName: input.displayName,
        hasEmail: input.hasEmail,
        linkedToUserId: input.linkedToUserId,
        labels: {
          ownerName: input.displayName,
          createdBy: input.createdByLabel,
        },
      },
    };
  },
});
