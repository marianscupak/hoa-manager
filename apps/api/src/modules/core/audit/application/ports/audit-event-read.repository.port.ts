import type { AuditEvent } from '@/modules/core/audit/domain/audit-event';
import type { Visibility } from '@/modules/core/audit/domain/visibility';

export interface AuditEventReadRecord extends AuditEvent {
  id: string;
  correlationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface VisibilityScope {
  allowedVisibilities: Visibility[];
  alwaysIncludeForActorUserId?: string;
}

export interface FindByAggregateParams {
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  scope: VisibilityScope;
  limit?: number;
}

export interface FindRecentParams {
  tenantId: string;
  scope: VisibilityScope;
  limit: number;
}

export interface AuditEventReadRepository {
  findByAggregate(
    params: FindByAggregateParams,
  ): Promise<AuditEventReadRecord[]>;
  findRecent(params: FindRecentParams): Promise<AuditEventReadRecord[]>;
}

export const AUDIT_EVENT_READ_REPOSITORY = Symbol(
  'AUDIT_EVENT_READ_REPOSITORY',
);
