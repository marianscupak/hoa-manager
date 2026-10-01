import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { CoreEventType } from '@/modules/core/audit-projections/core-event-types';
import type { AuditActor } from '@/shared/domain/actor';

const PayloadSchema = z.object({
  inviteId: z.uuid(),
  emailHash: z.string().length(64), // sha256 hex
  labels: z.object({
    ownerName: z.string(),
    emailMasked: z.string(),
    sentBy: z.string(),
  }),
});

export const OwnerInviteSentAuditEvent = defineAuditEvent({
  eventType: CoreEventType.OWNER_INVITE_SENT,
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
    emailHash: string;
    actor: AuditActor;
    ownerLabel: string;
    emailMaskedLabel: string;
    sentByLabel: string;
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
        emailHash: input.emailHash,
        labels: {
          ownerName: input.ownerLabel,
          emailMasked: input.emailMaskedLabel,
          sentBy: input.sentByLabel,
        },
      },
    };
  },
});
