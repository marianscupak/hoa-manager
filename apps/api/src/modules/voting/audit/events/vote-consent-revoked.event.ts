import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  consentId: z.uuid(),
  unitId: z.uuid(),
  // `null` when the consent's grantor has no user account (and therefore no
  // membership) — e.g. a POA recorded for an SJM spouse without a login.
  ownerMembershipId: z.uuid().nullable(),
  delegateMembershipId: z.uuid(),
  revokedByMembershipId: z.uuid(),
  labels: z.object({
    voteTitle: z.string(),
    unitLabel: z.string(),
    owner: z.string(),
    delegate: z.string(),
    actor: z.string(),
  }),
});

export const VoteConsentRevokedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_CONSENT_REVOKED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: 'CONSENT',
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    consentId: string;
    unitId: string;
    unitLabel: string;
    ownerMembershipId: string | null;
    ownerLabel: string;
    delegateMembershipId: string;
    delegateLabel: string;
    revokedByMembershipId: string;
    actor: AuditActor;
    actorLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: input.consentId,
      payload: {
        consentId: input.consentId,
        unitId: input.unitId,
        ownerMembershipId: input.ownerMembershipId,
        delegateMembershipId: input.delegateMembershipId,
        revokedByMembershipId: input.revokedByMembershipId,
        labels: {
          voteTitle: input.voteTitle,
          unitLabel: input.unitLabel,
          owner: input.ownerLabel,
          delegate: input.delegateLabel,
          actor: input.actorLabel,
        },
      },
    };
  },
});
