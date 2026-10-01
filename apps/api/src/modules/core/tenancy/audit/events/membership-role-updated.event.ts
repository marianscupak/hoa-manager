import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import { TenantMembershipRole } from '@/shared/domain/membership';

const PayloadSchema = z.object({
  userId: z.uuid(),
  previousRole: z.enum(TenantMembershipRole),
  newRole: z.enum(TenantMembershipRole),
  labels: z.object({
    memberName: z.string(),
    changedBy: z.string(),
  }),
});

export const MembershipRoleUpdatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.MEMBERSHIP_ROLE_UPDATED,
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
    previousRole: TenantMembershipRole;
    newRole: TenantMembershipRole;
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
        previousRole: input.previousRole,
        newRole: input.newRole,
        labels: {
          memberName: input.memberNameLabel,
          changedBy: input.changedByLabel,
        },
      },
    };
  },
});
