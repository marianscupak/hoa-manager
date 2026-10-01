import { z } from 'zod';

import { defineAuditEvent } from '@/modules/core/audit/application/registry/define-audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import type { AuditActor } from '@/shared/domain/actor';

import { VotingEventType } from '../voting-event-types';

const PayloadSchema = z.object({
  unitId: z.uuid(),
  status: z.enum(['PRESENT', 'ABSENT']),
  labels: z.object({
    voteTitle: z.string(),
    unitLabel: z.string(),
    // Null when the unit was marked absent, or present with no voter chosen
    // yet — the roster allows that intermediate state while recording.
    voterLabel: z.string().nullable(),
    recordedBy: z.string(),
  }),
});

export const AssemblyAttendanceRecordedAuditEvent = defineAuditEvent({
  eventType: VotingEventType.ASSEMBLY_ATTENDANCE_RECORDED,
  module: 'VOTING',
  payloadSchema: PayloadSchema,
  visibility: Visibility.TENANT_PRIVILEGED,
  tenantRequired: true,
  aggregateType: 'VOTE',
  entityType: null,
  build(input: {
    voteId: string;
    tenantId: string;
    unitId: string;
    status: 'PRESENT' | 'ABSENT';
    voteTitle: string;
    unitLabel: string;
    voterLabel: string | null;
    recordedByLabel: string;
    actor: AuditActor;
    occurredAt: Date;
  }) {
    return {
      occurredAt: input.occurredAt,
      actor: input.actor,
      tenantId: input.tenantId,
      aggregateId: input.voteId,
      entityId: null,
      payload: {
        unitId: input.unitId,
        status: input.status,
        labels: {
          voteTitle: input.voteTitle,
          unitLabel: input.unitLabel,
          voterLabel: input.voterLabel,
          recordedBy: input.recordedByLabel,
        },
      },
    };
  },
});
