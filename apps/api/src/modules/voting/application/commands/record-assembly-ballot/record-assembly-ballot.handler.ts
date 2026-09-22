import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  VOTE_ATTENDANCE_REPOSITORY,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { BallotCastProxyAuditEvent } from '@/modules/voting/audit/events/ballot-cast-proxy.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { assertAnswersMatchQuestions } from '@/modules/voting/domain/vote/ballot-answers';
import { VoteMode, VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  AssemblyVoterNotRecordedException,
  NotAnAssemblyRecordException,
  UnitNotPresentException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { RecordAssemblyBallotCommand } from './record-assembly-ballot.command';

@CommandHandler(RecordAssemblyBallotCommand)
export class RecordAssemblyBallotHandler
  implements ICommandHandler<RecordAssemblyBallotCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(VOTE_ATTENDANCE_REPOSITORY)
    private readonly attendanceRepo: VoteAttendanceRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: RecordAssemblyBallotCommand): Promise<void> {
    const { tenantId, voteId, actorMembershipId, unitId, answers } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteReadRepository.findDetailById(
        tenantId,
        voteId,
      );
      if (!vote) {
        throw new VoteNotFoundException();
      }
      // Mode before status, so a per-rollam caller gets the accurate reason.
      if (vote.mode !== VoteMode.ASSEMBLY_RECORD) {
        throw new NotAnAssemblyRecordException();
      }
      if (vote.status !== VoteStatus.DRAFT) {
        throw new VoteNotDraftException();
      }

      const attendance = await this.attendanceRepo.findByVote(tenantId, voteId);
      const row = attendance.find((a) => a.unitId === unitId);
      if (!row || row.status !== 'PRESENT') {
        throw new UnitNotPresentException();
      }
      if (!row.voterOwnerId && !row.voterNote) {
        throw new AssemblyVoterNotRecordedException();
      }

      // The same completeness rule the owner booth uses: a ballot answers
      // every question exactly once.
      assertAnswersMatchQuestions(vote.questions, answers);

      // Transcribing minutes means typos, so re-entering a unit replaces what
      // was there. The unique (vote, unit) constraint would otherwise reject
      // the correction outright. Safe only because this command is confined to
      // an assembly record still in draft — a cast ballot stays final
      // everywhere else.
      await this.voteWriteRepository.deleteBallotForUnit(
        tenantId,
        voteId,
        unitId,
      );

      const [saved] = await this.voteWriteRepository.saveBallots(
        tenantId,
        voteId,
        [
          {
            unitId,
            castByMembershipId: actorMembershipId,
            castMethod: 'BOARD_PROXY' as const,
            // Deliberately not checked against `signerOwnsUnit`, the way the
            // paper-ballot path does: a co-owned unit is voted by its common
            // representative, who need not own that unit, and a proxy holder
            // may own nothing at all. Authority was established when the
            // attendance row was written; this is provenance.
            attributionOwnerId: row.voterOwnerId,
            attachmentDocumentId: null,
            answers,
          },
        ],
      );

      const actor = this.auditContext.requireActor();
      const labeledAnswers = answers.map((a) => {
        const question = vote.questions.find((q) => q.id === a.questionId);
        const option = question?.options.find((o) => o.id === a.optionId);
        return {
          questionText: question?.title ?? '',
          optionText: option?.label ?? '',
          optionKey: option?.optionKey,
        };
      });

      await this.auditService.append(
        BallotCastProxyAuditEvent.build({
          tenantId,
          voteId,
          voteTitle: vote.title,
          ballotId: saved.ballotId,
          unitId,
          unitLabel: await this.labelResolver.resolveUnitLabel(unitId),
          signerOwnerId: row.voterOwnerId,
          // Falls back to the note so a proxy holder who owns nothing does not
          // render as an empty name.
          signerLabel: row.voterOwnerId
            ? await this.labelResolver.resolveOwnerLabel(row.voterOwnerId)
            : (row.voterNote as string),
          // The minutes are the document for an assembly; nothing is attached
          // per unit.
          attachmentFileName: null,
          actor,
          castByLabel: await this.labelResolver.resolveActorLabel(actor),
          answers,
          labeledAnswers,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
