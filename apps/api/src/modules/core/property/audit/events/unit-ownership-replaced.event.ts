import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

const PayloadSchema = z.object({
  ownerships: z.array(z.object({ ownerId: z.uuid(), share: z.string() })),
  labels: z.object({
    unitLabel: z.string(),
    changedBy: z.string(),
    owners: z.array(z.string()),
  }),
});

export const UnitOwnershipReplacedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.UNIT_OWNERSHIP_REPLACED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'UNIT',
  entityType: null,
  build(input: {
    tenantId: string;
    unitId: string;
    ownerships: { ownerId: string; share: string }[];
    actor: AuditActor;
    unitLabel: string;
    changedByLabel: string;
    ownerLabels: string[];
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.unitId,
      entityId: null,
      payload: {
        ownerships: input.ownerships,
        labels: {
          unitLabel: input.unitLabel,
          changedBy: input.changedByLabel,
          owners: input.ownerLabels,
        },
      },
    };
  },
});
