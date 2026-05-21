import { MembershipCreatedAuditEvent } from './events/membership-created.event';
import { MembershipRoleUpdatedAuditEvent } from './events/membership-role-updated.event';
import { MembershipStatusUpdatedAuditEvent } from './events/membership-status-updated.event';
import { TenantCreatedAuditEvent } from './events/tenant-created.event';

export const TENANCY_AUDIT_EVENTS = [
  TenantCreatedAuditEvent,
  MembershipCreatedAuditEvent,
  MembershipRoleUpdatedAuditEvent,
  MembershipStatusUpdatedAuditEvent,
];
