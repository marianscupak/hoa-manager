import { Injectable, OnModuleInit } from '@nestjs/common';

import type { AuditEventReadRecord } from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import type {
  AuditEventFormatter,
  TimelineEntry,
  ViewerContext,
} from '@/modules/core/audit/application/services/audit-event-formatter';
import { AuditFormatterRegistry } from '@/modules/core/audit/application/services/audit-formatter-registry';

import { CoreEventType } from './core-event-types';
import { t } from './projections/core-audit-strings';

@Injectable()
export class CoreAuditFormatter implements AuditEventFormatter, OnModuleInit {
  readonly module = 'CORE';

  constructor(private readonly registry: AuditFormatterRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  format(event: AuditEventReadRecord, viewer: ViewerContext): TimelineEntry {
    const lang = viewer.viewerLanguage;
    const navigateTo = this.deriveNavigateTo(event);

    const base = {
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      eventType: event.eventType,
      navigateTo,
    };

    switch (event.eventType) {
      case CoreEventType.TENANT_CREATED: {
        const p = event.payload as { labels: { createdBy: string } };
        return {
          ...base,
          message: t(lang, 'tenant.created.public', {
            actor: p.labels.createdBy,
          }),
        };
      }
      case CoreEventType.MEMBERSHIP_CREATED: {
        const p = event.payload as {
          role: string;
          labels: { memberName: string; addedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'membership.created.privileged', {
            actor: p.labels.addedBy,
            member: p.labels.memberName,
            role: p.role,
          }),
        };
      }
      case CoreEventType.MEMBERSHIP_ROLE_UPDATED: {
        const p = event.payload as {
          previousRole: string;
          newRole: string;
          labels: { memberName: string; changedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'membership.role.updated.privileged', {
            actor: p.labels.changedBy,
            member: p.labels.memberName,
            previousRole: p.previousRole,
            newRole: p.newRole,
          }),
        };
      }
      case CoreEventType.MEMBERSHIP_STATUS_UPDATED: {
        const p = event.payload as {
          previousStatus: string;
          newStatus: string;
          labels: { memberName: string; changedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'membership.status.updated.privileged', {
            actor: p.labels.changedBy,
            member: p.labels.memberName,
            previousStatus: p.previousStatus,
            newStatus: p.newStatus,
          }),
        };
      }
      case CoreEventType.UNIT_CREATED: {
        const p = event.payload as {
          labels: { unitLabel: string; createdBy: string };
        };
        return {
          ...base,
          message: t(lang, 'unit.created.privileged', {
            actor: p.labels.createdBy,
            unit: p.labels.unitLabel,
          }),
        };
      }
      case CoreEventType.UNIT_UPDATED: {
        const p = event.payload as {
          labels: { unitLabel: string; updatedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'unit.updated.privileged', {
            actor: p.labels.updatedBy,
            unit: p.labels.unitLabel,
          }),
        };
      }
      case CoreEventType.UNIT_DELETED: {
        const p = event.payload as {
          labels: { unitLabel: string; deletedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'unit.deleted.privileged', {
            actor: p.labels.deletedBy,
            unit: p.labels.unitLabel,
          }),
        };
      }
      case CoreEventType.OWNER_CREATED: {
        const p = event.payload as {
          labels: { ownerName: string; createdBy: string };
        };
        return {
          ...base,
          message: t(lang, 'owner.created.privileged', {
            actor: p.labels.createdBy,
            owner: p.labels.ownerName,
          }),
        };
      }
      case CoreEventType.OWNER_DELETED: {
        const p = event.payload as {
          labels: { ownerName: string; deletedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'owner.deleted.privileged', {
            actor: p.labels.deletedBy,
            owner: p.labels.ownerName,
          }),
        };
      }
      case CoreEventType.UNIT_OWNERSHIP_REPLACED: {
        const p = event.payload as {
          labels: { unitLabel: string; changedBy: string; owners: string[] };
        };
        return {
          ...base,
          message: t(lang, 'unit.ownership.replaced.privileged', {
            actor: p.labels.changedBy,
            unit: p.labels.unitLabel,
            owners: p.labels.owners.join(', '),
          }),
        };
      }
      case CoreEventType.OWNER_EMAIL_ADDED: {
        const p = event.payload as {
          labels: { ownerName: string; addedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'owner.email.added.privileged', {
            actor: p.labels.addedBy,
            owner: p.labels.ownerName,
          }),
        };
      }
      case CoreEventType.OWNER_USER_LINKED: {
        const p = event.payload as {
          labels: { ownerName: string; userName: string; linkedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'owner.user.linked.privileged', {
            actor: p.labels.linkedBy,
            owner: p.labels.ownerName,
            user: p.labels.userName,
          }),
        };
      }
      case CoreEventType.OWNER_INVITE_SENT: {
        const p = event.payload as {
          labels: { ownerName: string; emailMasked: string; sentBy: string };
        };
        return {
          ...base,
          message: t(lang, 'invite.sent.privileged', {
            actor: p.labels.sentBy,
            email: p.labels.emailMasked,
            owner: p.labels.ownerName,
          }),
        };
      }
      case CoreEventType.OWNER_INVITE_REVOKED: {
        const p = event.payload as {
          labels: { ownerName: string; revokedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'invite.revoked.privileged', {
            actor: p.labels.revokedBy,
            owner: p.labels.ownerName,
          }),
        };
      }
      case CoreEventType.OWNER_INVITE_ACCEPTED: {
        const p = event.payload as {
          labels: { ownerName: string; userName: string };
        };
        return {
          ...base,
          message: t(lang, 'invite.accepted.public', {
            user: p.labels.userName,
          }),
        };
      }
      default:
        return {
          ...base,
          message: t(lang, 'unknown', { eventType: event.eventType }),
        };
    }
  }

  private deriveNavigateTo(event: AuditEventReadRecord): string | null {
    if (!event.aggregate) return null;
    switch (event.aggregate.type) {
      case 'UNIT':
        return `/admin/units`;
      case 'OWNER':
        return `/admin/owners`;
      case 'MEMBERSHIP':
        return `/admin/users`;
      case 'TENANT':
      default:
        return null;
    }
  }
}
