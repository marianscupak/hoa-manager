import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  unitNo: z.string(),
  labels: z.object({
    unitLabel: z.string(),
    deletedBy: z.string(),
  }),
});

export const UnitDeletedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.UNIT_DELETED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'UNIT',
  entityType: null,
  build(input: {
    tenantId: string;
    unitId: string;
    unitNo: string;
    actor: AuditActor;
    deletedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.unitId,
      entityId: null,
      payload: {
        unitNo: input.unitNo,
        labels: { unitLabel: input.unitNo, deletedBy: input.deletedByLabel },
      },
    };
  },
});
