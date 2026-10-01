import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  unitNo: z.string(),
  buildingShareNumerator: z.number().int().positive(),
  buildingShareDenominator: z.number().int().positive(),
  labels: z.object({
    unitLabel: z.string(),
    createdBy: z.string(),
  }),
});

export const UnitCreatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.UNIT_CREATED,
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
    buildingShareNumerator: number;
    buildingShareDenominator: number;
    actor: AuditActor;
    createdByLabel: string;
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
        buildingShareNumerator: input.buildingShareNumerator,
        buildingShareDenominator: input.buildingShareDenominator,
        labels: { unitLabel: input.unitNo, createdBy: input.createdByLabel },
      },
    };
  },
});
