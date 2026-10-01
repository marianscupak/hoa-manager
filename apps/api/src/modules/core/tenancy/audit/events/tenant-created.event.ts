import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  tenantName: z.string(),
  labels: z.object({
    createdBy: z.string(),
  }),
});

export const TenantCreatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.TENANT_CREATED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PUBLIC,
  tenantRequired: true,
  aggregateType: 'TENANT',
  entityType: null,
  build(input: {
    tenantId: string;
    tenantName: string;
    actor: AuditActor;
    createdByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.tenantId,
      entityId: null,
      payload: {
        tenantName: input.tenantName,
        labels: { createdBy: input.createdByLabel },
      },
    };
  },
});
