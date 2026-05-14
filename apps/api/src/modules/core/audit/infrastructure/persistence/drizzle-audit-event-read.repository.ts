import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { auditEvents } from '@/infrastructure/db/schema/core/audit-events';
import type {
  AuditEventReadRecord,
  AuditEventReadRepository,
  FindByAggregateParams,
  FindRecentParams,
} from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import type { AuditActor } from '@/modules/core/audit/domain/actor';
import type { AuditEventType } from '@/modules/core/audit/domain/audit-event-types';
import type { Visibility } from '@/modules/core/audit/domain/visibility';

import { RESERVED_PAYLOAD_KEY } from './audit-payload.constants';

type AuditEventRow = typeof auditEvents.$inferSelect;

@Injectable()
export class DrizzleAuditEventReadRepository implements AuditEventReadRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return (DRIZZLE_TX_STORAGE.getStore() ??
      this.drizzle.db) as typeof this.drizzle.db;
  }

  async findByAggregate(params: FindByAggregateParams): Promise<AuditEventReadRecord[]> {
    const { tenantId, aggregateType, aggregateId, scope, limit } = params;

    const visibilityCondition = inArray(auditEvents.visibility, scope.allowedVisibilities);
    const filter = scope.alwaysIncludeForActorUserId
      ? or(
          visibilityCondition,
          eq(auditEvents.actorUserId, scope.alwaysIncludeForActorUserId),
        )
      : visibilityCondition;

    const baseQuery = this.db
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.tenantId, tenantId),
          eq(auditEvents.aggregateType, aggregateType),
          eq(auditEvents.aggregateId, aggregateId),
          filter,
        ),
      )
      .orderBy(asc(auditEvents.occurredAt));

    const rows = limit !== undefined ? await baseQuery.limit(limit) : await baseQuery;

    return rows.map((r) => this.mapRow(r));
  }

  async findRecent(params: FindRecentParams): Promise<AuditEventReadRecord[]> {
    const { tenantId, scope, limit } = params;

    const visibilityCondition = inArray(
      auditEvents.visibility,
      scope.allowedVisibilities,
    );
    const filter = scope.alwaysIncludeForActorUserId
      ? or(
          visibilityCondition,
          eq(auditEvents.actorUserId, scope.alwaysIncludeForActorUserId),
        )
      : visibilityCondition;

    const rows = await this.db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.tenantId, tenantId), filter))
      .orderBy(desc(auditEvents.occurredAt))
      .limit(limit);

    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: AuditEventRow): AuditEventReadRecord {
    const rawPayload = (r.payload ?? {}) as Record<string, unknown> & {
      [RESERVED_PAYLOAD_KEY]?: { reason?: string };
    };

    const { [RESERVED_PAYLOAD_KEY]: reserved, ...payload } = rawPayload;

    return {
      id: r.id,
      occurredAt: r.occurredAt,
      tenantId: r.tenantId,
      module: r.module,
      eventType: r.eventType as AuditEventType,
      actor: this.reconstructActor(r, reserved),
      aggregate:
        r.aggregateType !== null && r.aggregateId !== null
          ? { type: r.aggregateType, id: r.aggregateId }
          : null,
      entity:
        r.entityType !== null && r.entityId !== null
          ? { type: r.entityType, id: r.entityId }
          : null,
      visibility: r.visibility as Visibility,
      payload: payload as Record<string, unknown>,
      correlationId: r.correlationId,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
    };
  }

  private reconstructActor(
    r: AuditEventRow,
    reserved: { reason?: string } | undefined,
  ): AuditActor {
    if (r.actorType === 'USER') {
      if (r.actorUserId === null) {
        throw new Error(
          `audit_events row ${r.id}: actorType='USER' but actorUserId is null`,
        );
      }
      return {
        type: 'USER',
        userId: r.actorUserId,
        membershipId: r.actorMembershipId,
      };
    }

    const reason = reserved?.reason;
    if (reason === undefined) {
      throw new Error(
        `audit_events row ${r.id}: actorType='SYSTEM' but payload.${RESERVED_PAYLOAD_KEY}.reason is missing`,
      );
    }
    return { type: 'SYSTEM', reason };
  }
}
