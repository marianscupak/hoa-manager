import { OwnerInviteAcceptedAuditEvent } from './events/owner-invite-accepted.event';
import { OwnerInviteRevokedAuditEvent } from './events/owner-invite-revoked.event';
import { OwnerInviteSentAuditEvent } from './events/owner-invite-sent.event';

export const INVITATION_AUDIT_EVENTS = [
  OwnerInviteSentAuditEvent,
  OwnerInviteRevokedAuditEvent,
  OwnerInviteAcceptedAuditEvent,
];
