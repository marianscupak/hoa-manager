import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  ownerships: z.array(
    z.object({
      partyType: z.enum(['SOLE', 'SJM']),
      share: z.string(),
      memberOwnerIds: z.array(z.string()),
    }),
  ),
  effectiveFrom: z.string(),
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
    ownerships: {
      partyType: 'SOLE' | 'SJM';
      share: string;
      memberOwnerIds: string[];
    }[];
    effectiveFrom: string;
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
        effectiveFrom: input.effectiveFrom,
        labels: {
          unitLabel: input.unitLabel,
          changedBy: input.changedByLabel,
          owners: input.ownerLabels,
        },
      },
    };
  },
});
