import type { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

import type { AuditEventReadRecord } from '../ports/audit-event-read.repository.port';

export interface ViewerContext {
  viewerUserId: string;
  viewerRoles: TenantMembershipRole[];
  viewerLanguage: string;
}

/**
 * Shape of a single rendered timeline entry produced by a formatter.
 *
 * Mirrors the historical per-vote timeline shape (id, occurredAt as ISO
 * string, eventType, message, optional details), plus the new `navigateTo`
 * field used by the dashboard activity feed.
 */
export interface TimelineEntry {
  id: string;
  occurredAt: string;
  eventType: string;
  message: string;
  details?: Record<string, unknown>;
  /** Optional deep-link target (relative URL) — used by the dashboard feed. */
  navigateTo: string | null;
}

export interface AuditEventFormatter {
  /** The `module` value (e.g. 'VOTING') this formatter is responsible for. */
  readonly module: string;
  /** Render a single audit event into a timeline entry. */
  format(event: AuditEventReadRecord, viewer: ViewerContext): TimelineEntry;
}
