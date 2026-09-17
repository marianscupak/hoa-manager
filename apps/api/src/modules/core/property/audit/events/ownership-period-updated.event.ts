import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';

const PayloadSchema = z.object({
  previousValidFrom: z.string(),
  previousValidTo: z.string().nullable(),
  validFrom: z.string(),
  validTo: z.string().nullable(),
  /** How many votes the board was shown before confirming. */
  affectedVoteCount: z.number(),
  labels: z.object({
    unit: z.string(),
    changedBy: z.string(),
  }),
});

/**
 * Moving the bounds of a period rewrites who held the unit when. The old
 * bounds live on only here, and so does the fact that the board was warned.
 */
export const OwnershipPeriodUpdatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNERSHIP_PERIOD_UPDATED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'UNIT',
  entityType: null,
  build(input: {
    tenantId: string;
    unitId: string;
    unitLabel: string;
    previousValidFrom: Date;
    previousValidTo: Date | null;
    validFrom: Date;
    validTo: Date | null;
    affectedVoteCount: number;
    actor: AuditActor;
    changedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.unitId,
      entityId: null,
      payload: {
        previousValidFrom: input.previousValidFrom.toISOString(),
        previousValidTo: input.previousValidTo?.toISOString() ?? null,
        validFrom: input.validFrom.toISOString(),
        validTo: input.validTo?.toISOString() ?? null,
        affectedVoteCount: input.affectedVoteCount,
        labels: {
          unit: input.unitLabel,
          changedBy: input.changedByLabel,
        },
      },
    };
  },
});
