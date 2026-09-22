import { Injectable, OnModuleInit } from '@nestjs/common';

import type { AuditEventReadRecord } from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import type {
  AuditEventFormatter,
  TimelineEntry,
  ViewerContext,
} from '@/modules/core/audit/application/services/audit-event-formatter';
import { AuditFormatterRegistry } from '@/modules/core/audit/application/services/audit-formatter-registry';
import { VisibilityPolicyService } from '@/modules/core/audit/application/services/visibility-policy.service';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { t } from './projections/voting-audit-strings';
import { VotingEventType } from './voting-event-types';

@Injectable()
export class VotingAuditFormatter implements AuditEventFormatter, OnModuleInit {
  readonly module = 'VOTING';

  constructor(
    private readonly registry: AuditFormatterRegistry,
    private readonly visibilityPolicy: VisibilityPolicyService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  format(event: AuditEventReadRecord, viewer: ViewerContext): TimelineEntry {
    return this.renderOne(event, viewer);
  }

  private renderOne(
    event: AuditEventReadRecord,
    viewer: ViewerContext,
  ): TimelineEntry {
    const lang = viewer.viewerLanguage;
    const navigateTo =
      event.aggregate?.type === 'VOTE' && event.aggregate.id
        ? `/voting/${event.aggregate.id}`
        : null;

    const base = {
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      eventType: event.eventType,
      navigateTo,
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
      case VotingEventType.VOTE_RULESET_NON_STATUTORY_ACKNOWLEDGED: {
        const p = event.payload as {
          deviations: string[];
          labels: { voteTitle: string; acknowledgedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.rulesetNonStatutoryAcknowledged.privileged', {
            voteTitle: p.labels.voteTitle,
            deviations: p.deviations.join(', '),
          }),
        };
      }
      case VotingEventType.VOTE_SCHEDULED: {
        const p = event.payload as { labels: { voteTitle: string } };
        return {
          ...base,
          message: t(lang, 'vote.scheduled.public', {
            title: p.labels.voteTitle,
          }),
        };
      }
      case VotingEventType.VOTE_OPENED: {
        const p = event.payload as {
          labels: { voteTitle: string; openedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.opened.public', {
            title: p.labels.voteTitle,
          }),
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
      case VotingEventType.BALLOT_CAST_DIRECT: {
        const p = event.payload as {
          labels: {
            voteTitle: string;
            unitLabel: string;
            castBy: string;
            answers: {
              questionText: string;
              optionText: string;
              optionKey?: string;
            }[];
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
      case VotingEventType.BALLOT_CAST_PROXY: {
        const p = event.payload as {
          labels: {
            voteTitle: string;
            unitLabel: string;
            castBy: string;
            signerLabel: string;
            answers: {
              questionText: string;
              optionText: string;
              optionKey?: string;
            }[];
          };
        };
        return {
          ...base,
          message: t(lang, 'ballot.cast.proxy.privileged', {
            actor: p.labels.castBy,
            unit: p.labels.unitLabel,
            signer: p.labels.signerLabel,
          }),
          details: { answers: p.labels.answers },
        };
      }
      case VotingEventType.ASSEMBLY_ATTENDANCE_RECORDED: {
        const p = event.payload as {
          status: 'PRESENT' | 'ABSENT';
          labels: {
            unitLabel: string;
            voterLabel: string | null;
            recordedBy: string;
          };
        };
        return {
          ...base,
          message: t(
            lang,
            p.status === 'PRESENT'
              ? 'assembly.attendance.present.privileged'
              : 'assembly.attendance.absent.privileged',
            {
              actor: p.labels.recordedBy,
              unit: p.labels.unitLabel,
              // A present unit always has a voter by the time it can be
              // published; while recording it may not yet.
              voter: p.labels.voterLabel ?? '—',
            },
          ),
        };
      }
      case VotingEventType.ASSEMBLY_RECORD_PUBLISHED: {
        const p = event.payload as {
          presentCount: number;
          labels: { voteTitle: string; publishedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'assembly.record.published.public', {
            actor: p.labels.publishedBy,
            title: p.labels.voteTitle,
            present: String(p.presentCount),
          }),
        };
      }
      case VotingEventType.VOTE_CLOSED: {
        const p = event.payload as { labels: { voteTitle: string } };
        return {
          ...base,
          message: t(lang, 'vote.closed.public', {
            title: p.labels.voteTitle,
          }),
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
      case VotingEventType.VOTE_DELETED: {
        const p = event.payload as {
          labels: { voteTitle: string; deletedBy: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.deleted.privileged', {
            title: p.labels.voteTitle,
            actor: p.labels.deletedBy,
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
          ownerMembershipId: string | null;
          recordedByMembershipId?: string;
          labels: {
            voteTitle: string;
            unitLabel: string;
            owner: string;
            delegate: string;
            actor: string;
          };
        };
        if (p.recordedByMembershipId === undefined) {
          return {
            ...base,
            message: t(lang, 'vote.consent.created.privileged', {
              owner: p.labels.owner,
              delegate: p.labels.delegate,
              unit: p.labels.unitLabel,
            }),
          };
        }
        const isSelf = p.recordedByMembershipId === p.ownerMembershipId;
        return {
          ...base,
          message: t(
            lang,
            isSelf
              ? 'vote.consent.created.self'
              : 'vote.consent.created.byRecorder',
            {
              owner: p.labels.owner,
              delegate: p.labels.delegate,
              unit: p.labels.unitLabel,
              recorder: p.labels.actor,
            },
          ),
        };
      }
      case VotingEventType.VOTE_CONSENT_REVOKED: {
        const p = event.payload as {
          ownerMembershipId?: string | null;
          revokedByMembershipId?: string;
          labels: {
            voteTitle: string;
            unitLabel: string;
            owner: string;
            delegate: string;
            actor: string;
          };
        };
        if (p.revokedByMembershipId === undefined) {
          return {
            ...base,
            message: t(lang, 'vote.consent.revoked.privileged', {
              actor: p.labels.actor,
              unit: p.labels.unitLabel,
            }),
          };
        }
        const isSelf = p.revokedByMembershipId === p.ownerMembershipId;
        return {
          ...base,
          message: t(
            lang,
            isSelf
              ? 'vote.consent.revoked.self'
              : 'vote.consent.revoked.byRecorder',
            {
              owner: p.labels.owner,
              delegate: p.labels.delegate,
              unit: p.labels.unitLabel,
              recorder: p.labels.actor,
            },
          ),
        };
      }
      case VotingEventType.VOTE_DOCUMENT_ADDED: {
        const p = event.payload as {
          labels: { voteTitle: string; fileName: string; actor: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.document.added.privileged', {
            actor: p.labels.actor,
            fileName: p.labels.fileName,
            title: p.labels.voteTitle,
          }),
        };
      }
      case VotingEventType.VOTE_DOCUMENT_REMOVED: {
        const p = event.payload as {
          labels: { voteTitle: string; fileName: string; actor: string };
        };
        return {
          ...base,
          message: t(lang, 'vote.document.removed.privileged', {
            actor: p.labels.actor,
            fileName: p.labels.fileName,
            title: p.labels.voteTitle,
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
