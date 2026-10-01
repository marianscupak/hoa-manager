import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';
import { TenantMembershipStatus } from '@/shared/domain/membership';

const PayloadSchema = z.object({
  userId: z.uuid(),
  previousStatus: z.enum(TenantMembershipStatus),
  newStatus: z.enum(TenantMembershipStatus),
  labels: z.object({
    memberName: z.string(),
    changedBy: z.string(),
  }),
});

export const MembershipStatusUpdatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.MEMBERSHIP_STATUS_UPDATED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'MEMBERSHIP',
  entityType: null,
  build(input: {
    tenantId: string;
    membershipId: string;
    userId: string;
    previousStatus: TenantMembershipStatus;
    newStatus: TenantMembershipStatus;
    actor: AuditActor;
    memberNameLabel: string;
    changedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.membershipId,
      entityId: null,
      payload: {
        userId: input.userId,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        labels: {
          memberName: input.memberNameLabel,
          changedBy: input.changedByLabel,
        },
      },
    };
  },
});
