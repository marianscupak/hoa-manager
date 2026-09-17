import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

const PayloadSchema = z.object({
  labels: z.object({
    previousName: z.string(),
    ownerName: z.string(),
    renamedBy: z.string(),
  }),
});

/**
 * The register keeps no name history — an owner carries one `displayName` and
 * a rename reaches every record they appear in, past ones included. The name
 * they held before the rename therefore survives only in this event.
 */
export const OwnerRenamedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_RENAMED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'OWNER',
  entityType: null,
  build(input: {
    tenantId: string;
    ownerId: string;
    previousName: string;
    ownerName: string;
    actor: AuditActor;
    renamedByLabel: string;
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
          previousName: input.previousName,
          ownerName: input.ownerName,
          renamedBy: input.renamedByLabel,
        },
      },
    };
  },
});
