import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import {
  BallotAnswerSchema,
  LabeledBallotAnswerSchema,
} from './_shared.schemas';
import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  unitId: z.uuid(),
  // Null when an assembly record names a proxy holder who owns nothing;
  // `signerLabel` still carries the name for the sentence.
  signerOwnerId: z.uuid().nullable(),
  answers: z.array(BallotAnswerSchema),
  labels: z.object({
    voteTitle: z.string(),
    unitLabel: z.string(),
    castBy: z.string(),
    signerLabel: z.string(),
    // Null for an assembly record: the minutes are the document, and no
    // scan is attached per unit.
    attachmentFileName: z.string().nullable(),
    answers: z.array(LabeledBallotAnswerSchema),
  }),
});

export const BallotCastProxyAuditEvent = defineAuditEvent({
  eventType: VotingEventType.BALLOT_CAST_PROXY,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: 'BALLOT',
  build(input: {
    voteId: string;
    tenantId: string;
    voteTitle: string;
    ballotId: string;
    unitId: string;
    unitLabel: string;
    signerOwnerId: string | null;
    signerLabel: string;
    attachmentFileName: string | null;
    actor: AuditActor;
    castByLabel: string;
    answers: { questionId: string; optionId: string }[];
    labeledAnswers: { questionText: string; optionText: string }[];
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: input.ballotId,
      payload: {
        unitId: input.unitId,
        signerOwnerId: input.signerOwnerId,
        answers: input.answers,
        labels: {
          voteTitle: input.voteTitle,
          unitLabel: input.unitLabel,
          castBy: input.castByLabel,
          signerLabel: input.signerLabel,
          attachmentFileName: input.attachmentFileName,
          answers: input.labeledAnswers,
        },
      },
    };
  },
});
