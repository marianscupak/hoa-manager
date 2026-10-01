import { Inject, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import {
  AUDIT_EVENT_WRITE_REPOSITORY,
  type AuditEventWriteRepository,
} from '@/modules/core/audit/application/ports/audit-event-write.repository.port';
import { AuditEventRegistry } from '@/modules/core/audit/application/registry/audit-event.registry';
import type { AuditEvent } from '@/modules/core/audit/domain/audit-event';
import { AUDIT_CLS_KEYS } from '@/modules/core/audit/infrastructure/cls/audit-context.keys';
import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';
import type { AuditActor } from '@/shared/domain/actor';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_EVENT_WRITE_REPOSITORY)
    private readonly repo: AuditEventWriteRepository,
    private readonly registry: AuditEventRegistry,
    private readonly cls: ClsService,
  ) {}

  async append(event: AuditEvent): Promise<void> {
    const descriptor = this.registry.describe(event.eventType);

    if (descriptor.tenantRequired && event.tenantId === null) {
      throw new Error(`Audit event ${event.eventType} requires tenantId`);
    }
    if (
      descriptor.aggregateType &&
      event.aggregate?.type !== descriptor.aggregateType
    ) {
      throw new Error(
        `Audit event ${event.eventType} requires aggregate.type=${descriptor.aggregateType}, got ${event.aggregate?.type ?? 'null'}`,
      );
    }
    if (event.visibility !== descriptor.visibility) {
      throw new Error(
        `Audit event ${event.eventType} has fixed visibility ${descriptor.visibility}, got ${event.visibility}`,
      );
    }
    descriptor.payloadSchema.parse(event.payload);

    const clsActor = this.cls.get<AuditActor | undefined>(ACTOR_CLS_KEY);
    if (!clsActor) {
      throw new Error(
        'No audit actor in CLS — wrap scheduler calls in SystemActorRunner or run inside a request',
      );
    }
    if (clsActor.type !== event.actor.type) {
      throw new Error(
        `Audit event actor.type=${event.actor.type} does not match CLS actor.type=${clsActor.type}`,
      );
    }

    const correlationId = this.cls.getId() ?? null;
    const ipAddress =
      this.cls.get<string | null>(AUDIT_CLS_KEYS.ipAddress) ?? null;
    const userAgent =
      this.cls.get<string | null>(AUDIT_CLS_KEYS.userAgent) ?? null;

    await this.repo.append({ ...event, correlationId, ipAddress, userAgent });
  }
}
