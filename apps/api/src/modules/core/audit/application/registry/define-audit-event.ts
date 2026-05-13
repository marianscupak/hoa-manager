import type { z } from 'zod';

import type { AuditActor } from '@/modules/core/audit/domain/actor';
import type { AuditEvent } from '@/modules/core/audit/domain/audit-event';
import type { AuditEventType } from '@/modules/core/audit/domain/audit-event-types';
import type { Visibility } from '@/modules/core/audit/domain/visibility';

import type { AuditEventDescriptor } from './audit-event.registry';

interface BuildResult<TPayload> {
  payload: TPayload;
  tenantId: string | null;
  occurredAt: Date;
  actor: AuditActor;
  aggregateId: string | null;
  entityId: string | null;
}

export interface DefinedAuditEvent<TInput> {
  descriptor: AuditEventDescriptor;
  build: (input: TInput) => AuditEvent;
}

export function defineAuditEvent<
  TInput,
  TPayloadSchema extends z.ZodObject<z.ZodRawShape>,
>(config: {
  eventType: AuditEventType;
  module: string;
  payloadSchema: TPayloadSchema;
  visibility: Visibility;
  tenantRequired: boolean;
  aggregateType: string | null;
  entityType: string | null;
  build: (input: TInput) => BuildResult<z.infer<TPayloadSchema>>;
}): DefinedAuditEvent<TInput> {
  const descriptor: AuditEventDescriptor = {
    eventType: config.eventType,
    module: config.module,
    payloadSchema: config.payloadSchema,
    visibility: config.visibility,
    tenantRequired: config.tenantRequired,
    aggregateType: config.aggregateType,
    entityType: config.entityType,
  };

  return {
    descriptor,
    build(input: TInput): AuditEvent {
      const r = config.build(input);
      return {
        occurredAt: r.occurredAt,
        tenantId: r.tenantId,
        module: config.module,
        eventType: config.eventType,
        actor: r.actor,
        aggregate:
          r.aggregateId !== null && config.aggregateType !== null
            ? { type: config.aggregateType, id: r.aggregateId }
            : null,
        entity:
          r.entityId !== null && config.entityType !== null
            ? { type: config.entityType, id: r.entityId }
            : null,
        visibility: config.visibility,
        payload: r.payload,
      };
    },
  };
}
