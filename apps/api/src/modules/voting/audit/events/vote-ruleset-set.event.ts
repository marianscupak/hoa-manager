import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  type VoteRuleset,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

import { VotingEventType } from '../voting-event-types';

const VoteRulesetSchema = z.object({
  weightBasis: z.enum(VoteWeightBasis),
  quorumMeasure: z.enum(QuorumMeasure),
  quorumElectorateBasis: z.enum(QuorumElectorateBasis),
  quorumThreshold: z.number(),
  majorityRuleType: z.enum(MajorityRuleType),
  majorityThreshold: z.number().nullable(),
  allowAbstain: z.boolean(),
  abstainExcludedFromMajorityDenominator: z.boolean(),
  allowCoOwnerIndividualVote: z.boolean(),
});

const PayloadSchema = z.object({
  ruleset: VoteRulesetSchema,
  labels: z.object({
    voteTitle: z.string(),
    setBy: z.string(),
  }),
});

export const VoteRulesetSetAuditEvent = defineAuditEvent({
  eventType: VotingEventType.VOTE_RULESET_SET,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: null,
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    ruleset: VoteRuleset;
    actor: AuditActor;
    setByLabel: string;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        ruleset: input.ruleset,
        labels: {
          voteTitle: input.voteTitle,
          setBy: input.setByLabel,
        },
      },
    };
  },
});
