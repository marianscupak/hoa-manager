import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  inviteId: z.uuid(),
  labels: z.object({
    ownerName: z.string(),
    revokedBy: z.string(),
  }),
});

export const OwnerInviteRevokedAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_INVITE_REVOKED,
  module: 'CORE',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'OWNER',
  entityType: null,
  build(input: {
    tenantId: string;
    ownerId: string;
    inviteId: string;
    actor: AuditActor;
    ownerLabel: string;
    revokedByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.ownerId,
      entityId: null,
      payload: {
        inviteId: input.inviteId,
        labels: {
          ownerName: input.ownerLabel,
          revokedBy: input.revokedByLabel,
        },
      },
    };
  },
});
