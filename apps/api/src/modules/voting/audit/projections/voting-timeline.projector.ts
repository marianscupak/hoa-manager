import { Injectable } from '@nestjs/common';

import type { AuditEventReadRecord } from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import { VisibilityPolicyService } from '@/modules/core/audit/application/services/visibility-policy.service';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';

import { VotingEventType } from '../voting-event-types';
import { t } from './voting-audit-strings';

export interface TimelineEntry {
  id: string;
  occurredAt: string;
  eventType: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ViewerContext {
  viewerUserId: string;
  viewerRoles: TenantMembershipRole[];
  viewerLanguage: string;
}

@Injectable()
export class VotingTimelineProjector {
  constructor(private readonly visibilityPolicy: VisibilityPolicyService) {}

  project(events: AuditEventReadRecord[], viewer: ViewerContext): TimelineEntry[] {
    return events.map((e) => this.renderOne(e, viewer));
  }

  private renderOne(
    event: AuditEventReadRecord,
    viewer: ViewerContext,
  ): TimelineEntry {
    const lang = viewer.viewerLanguage;
    const base = {
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      eventType: event.eventType,
    };

    switch (event.eventType) {
      case VotingEventType.VOTE_CREATED: {
        const p = event.payload as {
          labels: { voteTitle: string; createdBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.created.privileged', {
            title: p.labels.voteTitle,
            actor: p.labels.createdBy,
          }),
        };
      }
      case VotingEventType.VOTE_RULESET_SET: {
        const p = event.payload as {
          labels: { voteTitle: string; setBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.rulesetSet.privileged', {
            title: p.labels.voteTitle,
            actor: p.labels.setBy,
          }),
        };
      }
      case VotingEventType.VOTE_SCHEDULED: {
        const p = event.payload as { labels: { voteTitle: string } };
        return {
          ...base,
          message: t(lang, 'vote.scheduled.public', { title: p.labels.voteTitle }),
        };
      }
      case VotingEventType.VOTE_OPENED: {
        const p = event.payload as {
          labels: { voteTitle: string; openedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.opened.public', { title: p.labels.voteTitle }),
        };
      }
      case VotingEventType.VOTE_ELECTORATE_SNAPSHOTTED: {
        const p = event.payload as {
          totalUnits: number;
          labels: { voteTitle: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.electorateSnapshotted.privileged', {
            title: p.labels.voteTitle,
            totalUnits: String(p.totalUnits),
          }),
        };
      }
      case VotingEventType.BALLOT_CAST_DIRECT:
      case VotingEventType.BALLOT_CAST_PROXY: {
        const p = event.payload as {
          labels: {
            voteTitle: string;
            unitLabel: string;
            castBy: string;
            answers: { questionText: string; optionText: string }[];
          };
        };
        const isOwnBallot =
          event.actor.type === 'USER' &&
          event.actor.userId === viewer.viewerUserId;
        const isPrivileged = this.visibilityPolicy
          .fromRoles(viewer.viewerRoles)
          .includes(Visibility.TENANT_PRIVILEGED);

        if (isOwnBallot && !isPrivileged) {
          return { ...base, message: t(lang, 'ballot.cast.self', {}) };
        }
        return {
          ...base,
          message: t(lang, 'ballot.cast.privileged', {
            actor: p.labels.castBy,
            unit: p.labels.unitLabel,
          }),
          details: { answers: p.labels.answers },
        };
      }
      case VotingEventType.VOTE_CLOSED: {
        const p = event.payload as { labels: { voteTitle: string } };
        return {
          ...base,
          message: t(lang, 'vote.closed.public', { title: p.labels.voteTitle }),
        };
      }
      case VotingEventType.VOTE_RESULTS_COMPUTED: {
        const p = event.payload as { labels: { voteTitle: string } };
        return {
          ...base,
          message: t(lang, 'vote.resultsComputed.public', {
            title: p.labels.voteTitle,
          }),
        };
      }
      case VotingEventType.VOTE_UPDATED: {
        const p = event.payload as {
          labels: { voteTitle: string; updatedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.updated.privileged', {
            title: p.labels.voteTitle,
            actor: p.labels.updatedBy,
          }),
        };
      }
      case VotingEventType.VOTE_QUESTION_CREATED: {
        const p = event.payload as {
          labels: { voteTitle: string; questionTitle: string; actor: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.question.created.privileged', {
            actor: p.labels.actor,
            question: p.labels.questionTitle,
            title: p.labels.voteTitle,
          }),
        };
      }
      case VotingEventType.VOTE_QUESTION_UPDATED: {
        const p = event.payload as {
          labels: { voteTitle: string; questionTitle: string; actor: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.question.updated.privileged', {
            actor: p.labels.actor,
            question: p.labels.questionTitle,
            title: p.labels.voteTitle,
          }),
        };
      }
      case VotingEventType.VOTE_QUESTION_DELETED: {
        const p = event.payload as {
          labels: { voteTitle: string; questionTitle: string; actor: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.question.deleted.privileged', {
            actor: p.labels.actor,
            question: p.labels.questionTitle,
            title: p.labels.voteTitle,
          }),
        };
      }
      case VotingEventType.VOTE_CONSENT_CREATED: {
        const p = event.payload as {
          labels: {
            voteTitle: string;
            unitLabel: string;
            owner: string;
            delegate: string;
            actor: string;
          };
        };
        return {
          ...base,
          message: t(lang, 'vote.consent.created.privileged', {
            owner: p.labels.owner,
            delegate: p.labels.delegate,
            unit: p.labels.unitLabel,
          }),
        };
      }
      case VotingEventType.VOTE_CONSENT_REVOKED: {
        const p = event.payload as {
          labels: {
            voteTitle: string;
            unitLabel: string;
            owner: string;
            delegate: string;
            actor: string;
          };
        };
        return {
          ...base,
          message: t(lang, 'vote.consent.revoked.privileged', {
            actor: p.labels.actor,
            unit: p.labels.unitLabel,
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
}
