import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  labels: z.object({
    ownerName: z.string(),
    addedBy: z.string(),
  }),
});

export const OwnerEmailAddedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_EMAIL_ADDED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'OWNER',
  entityType: null,
  build(input: {
    tenantId: string;
    ownerId: string;
    ownerName: string;
    actor: AuditActor;
    addedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.ownerId,
      entityId: null,
      payload: {
        labels: {
          ownerName: input.ownerName,
          addedBy: input.addedByLabel,
        },
      },
    };
  },
});
