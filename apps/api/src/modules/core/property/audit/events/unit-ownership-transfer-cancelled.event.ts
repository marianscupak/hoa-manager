import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  effectiveFrom: z.string(),
  ownerships: z.array(
    z.object({
      partyType: z.enum(['SOLE', 'SJM']),
      share: z.string(),
      memberOwnerIds: z.array(z.string()),
    }),
  ),
  labels: z.object({
    unitLabel: z.string(),
    cancelledBy: z.string(),
    owners: z.array(z.string()),
  }),
});

export const UnitOwnershipTransferCancelledAuditEvent = defineAuditEvent({
  eventType: CoreEventType.UNIT_OWNERSHIP_TRANSFER_CANCELLED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'UNIT',
  entityType: null,
  build(input: {
    tenantId: string;
    unitId: string;
    effectiveFrom: string;
    ownerships: {
      partyType: 'SOLE' | 'SJM';
      share: string;
      memberOwnerIds: string[];
    }[];
    actor: AuditActor;
    unitLabel: string;
    cancelledByLabel: string;
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
        effectiveFrom: input.effectiveFrom,
        ownerships: input.ownerships,
        labels: {
          unitLabel: input.unitLabel,
          cancelledBy: input.cancelledByLabel,
          owners: input.ownerLabels,
        },
      },
    };
  },
});
