import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

const UnitFieldsSchema = z.object({
  unitNo: z.string(),
  buildingShareNumerator: z.number().int().positive(),
  buildingShareDenominator: z.number().int().positive(),
});

const PayloadSchema = z.object({
  previous: UnitFieldsSchema,
  next: UnitFieldsSchema,
  labels: z.object({
    unitLabel: z.string(),
    updatedBy: z.string(),
  }),
});

export const UnitUpdatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.UNIT_UPDATED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'UNIT',
  entityType: null,
  build(input: {
    tenantId: string;
    unitId: string;
    previous: {
      unitNo: string;
      buildingShareNumerator: number;
      buildingShareDenominator: number;
    };
    next: {
      unitNo: string;
      buildingShareNumerator: number;
      buildingShareDenominator: number;
    };
    actor: AuditActor;
    updatedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.unitId,
      entityId: null,
      payload: {
        previous: input.previous,
        next: input.next,
        labels: {
          unitLabel: input.next.unitNo,
          updatedBy: input.updatedByLabel,
        },
      },
    };
  },
});
