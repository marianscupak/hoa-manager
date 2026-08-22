import type { AuditEvent } from '@/modules/core/audit/domain/audit-event';

export interface AuditEventWriteRecord extends AuditEvent {
  correlationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditEventWriteRepository {
  append(event: AuditEventWriteRecord): Promise<void>;
  appendMany(events: AuditEventWriteRecord[]): Promise<void>;
}

export const AUDIT_EVENT_WRITE_REPOSITORY = Symbol(
  'AUDIT_EVENT_WRITE_REPOSITORY',
);
