import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import {
  MajorityDenominatorBasis,
  MajorityRuleType,
  QuorumMeasure,
  ThresholdComparator,
  type VoteRuleset,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const FractionSchema = z.object({ num: z.number(), den: z.number() });

const VoteRulesetSchema = z.object({
  weightBasis: z.enum(VoteWeightBasis),
  quorum: z
    .object({
      measure: z.enum(QuorumMeasure),
      threshold: FractionSchema,
      comparator: z.enum(ThresholdComparator),
    })
    .nullable(),
  majorityRuleType: z.enum(MajorityRuleType),
  majorityDenominatorBasis: z.enum(MajorityDenominatorBasis),
  majorityThreshold: FractionSchema,
  majorityComparator: z.enum(ThresholdComparator),
  allowAbstain: z.boolean(),
  acknowledgedNonStatutory: z.boolean(),
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
