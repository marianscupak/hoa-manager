import { Injectable } from '@nestjs/common';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { auditEvents } from '@/infrastructure/db/schema/core/audit-events';
import type {
  AuditEventWriteRecord,
  AuditEventWriteRepository,
} from '@/modules/core/audit/application/ports/audit-event-write.repository.port';

import { RESERVED_PAYLOAD_KEY } from './audit-payload.constants';

@Injectable()
export class DrizzleAuditEventWriteRepository
  implements AuditEventWriteRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async append(event: AuditEventWriteRecord): Promise<void> {
    await this.appendMany([event]);
  }

  async appendMany(events: AuditEventWriteRecord[]): Promise<void> {
    if (events.length === 0) return;

    await this.db.insert(auditEvents).values(
      events.map((e) => {
        // SYSTEM actor's reason is stashed under RESERVED_PAYLOAD_KEY because
        // the schema has no dedicated column for it. Read adapter strips it.
        const payload =
          e.actor.type === 'SYSTEM'
            ? {
                ...e.payload,
                [RESERVED_PAYLOAD_KEY]: { reason: e.actor.reason },
              }
            : e.payload;

        return {
          tenantId: e.tenantId,
          occurredAt: e.occurredAt,
          module: e.module,
          eventType: e.eventType,
          actorType: e.actor.type,
          actorUserId: e.actor.type === 'USER' ? e.actor.userId : null,
          actorMembershipId:
            e.actor.type === 'USER' ? e.actor.membershipId : null,
          aggregateType: e.aggregate?.type ?? null,
          aggregateId: e.aggregate?.id ?? null,
          entityType: e.entity?.type ?? null,
          entityId: e.entity?.id ?? null,
          visibility: e.visibility,
          payload,
          correlationId: e.correlationId,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
        };
      }),
    );
  }
}
