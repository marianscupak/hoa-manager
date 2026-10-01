import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  consentId: z.uuid(),
  unitId: z.uuid(),
  // `null` when the grantor was supplied by ownerId directly (admin
  // recording a POA for an account-less owner) — there is no membership to
  // point to in that case.
  ownerMembershipId: z.uuid().nullable(),
  // Exactly one is set — the representative is a person, stored as the
  // owner when they own in the tenant, else as the membership.
  delegateOwnerId: z.uuid().nullable(),
  delegateMembershipId: z.uuid().nullable(),
  recordedByMembershipId: z.uuid(),
  labels: z.object({
    voteTitle: z.string(),
    unitLabel: z.string(),
    owner: z.string(),
    delegate: z.string(),
    actor: z.string(),
  }),
});

export const VoteConsentCreatedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_CONSENT_CREATED,
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
    delegateOwnerId: string | null;
    delegateMembershipId: string | null;
    delegateLabel: string;
    recordedByMembershipId: string;
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
        delegateOwnerId: input.delegateOwnerId,
        delegateMembershipId: input.delegateMembershipId,
        recordedByMembershipId: input.recordedByMembershipId,
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
