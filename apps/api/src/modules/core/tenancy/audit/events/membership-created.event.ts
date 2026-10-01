import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/shared/domain/membership';

const PayloadSchema = z.object({
  userId: z.uuid(),
  role: z.enum(TenantMembershipRole),
  status: z.enum(TenantMembershipStatus),
  labels: z.object({
    memberName: z.string(),
    addedBy: z.string(),
  }),
});

export const MembershipCreatedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.MEMBERSHIP_CREATED,
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
    role: TenantMembershipRole;
    status: TenantMembershipStatus;
    actor: AuditActor;
    memberNameLabel: string;
    addedByLabel: string;
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
        role: input.role,
        status: input.status,
        labels: {
          memberName: input.memberNameLabel,
          addedBy: input.addedByLabel,
        },
      },
    };
  },
});
