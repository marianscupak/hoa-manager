import type { AuditActor } from '@/shared/domain/actor';

import type { AuditEventType } from './audit-event-types';
import type { Visibility } from './visibility';

export interface AuditEvent {
  occurredAt: Date;
  tenantId: string | null;
  module: string;
  eventType: AuditEventType;
  actor: AuditActor;
  aggregate: { type: string; id: string } | null;
  entity: { type: string; id: string } | null;
  visibility: Visibility;
  payload: Record<string, unknown>;
}
