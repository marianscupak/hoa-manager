import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  ELECTORATE_SERVICE,
  type ElectorateService,
} from '@/modules/voting/application/ports/electorate-service.port';
import {
  RESULT_CALCULATION_SERVICE,
  type ResultCalculationService,
} from '@/modules/voting/application/ports/result-calculation.service.port';
import {
  VOTE_ATTENDANCE_REPOSITORY,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { AssemblyRecordPublishedAuditEvent } from '@/modules/voting/audit/events/assembly-record-published.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteMode, VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  AssemblyRecordIncompleteException,
  NotAnAssemblyRecordException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { PublishAssemblyRecordCommand } from './publish-assembly-record.command';

@CommandHandler(PublishAssemblyRecordCommand)
export class PublishAssemblyRecordHandler
  implements ICommandHandler<PublishAssemblyRecordCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(VOTE_ATTENDANCE_REPOSITORY)
    private readonly attendanceRepo: VoteAttendanceRepository,
    @Inject(ELECTORATE_SERVICE)
    private readonly electorateService: ElectorateService,
    @Inject(RESULT_CALCULATION_SERVICE)
    private readonly resultCalculationService: ResultCalculationService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: PublishAssemblyRecordCommand): Promise<void> {
    const { tenantId, voteId, actorMembershipId } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }
      if (vote.mode !== VoteMode.ASSEMBLY_RECORD) {
        throw new NotAnAssemblyRecordException();
      }
      if (vote.status !== VoteStatus.DRAFT) {
        throw new VoteNotDraftException();
      }

      // 1. The gate. Every present unit must have a ballot, which is what
      //    makes the tally's "votes cast" denominator equal the shares that
      //    were in the room.
      const attendance = await this.attendanceRepo.findByVote(tenantId, voteId);
      // Zero rows means the board never started, not that nobody came: an
      // inquorate meeting still has every unit marked absent. The gate below
      // would pass vacuously, and publishing cannot be undone.
      if (attendance.length === 0) {
        throw new AssemblyRecordIncompleteException();
      }
      const present = attendance.filter((a) => a.status === 'PRESENT');
      const withBallot = new Set(
        await this.voteRepository.findUnitIdsWithBallot(tenantId, voteId),
      );
      if (present.some((a) => !withBallot.has(a.unitId))) {
        throw new AssemblyRecordIncompleteException();
      }

      // 2. The same electorate the board recorded against.
      //
      //    This used to resolve as of `scheduledFrom`, the meeting date, on
      //    the theory that a unit sold since the meeting should still count
      //    for the owner who attended. It bought nothing: who voted for a
      //    unit is settled by the attendance row's `voterOwnerId`, which the
      //    board picks from the live roster, not by the electorate. And it
      //    cost a silent, severe failure — the ownership history frequently
      //    does not reach back to the meeting, which is inherent to a mode
      //    for writing up a meeting that already happened. When it does not,
      //    every unit resolves as MISSING_OWNERSHIP, and a unit the
      //    association owns loses the ASSOCIATION_OWNED classification that
      //    keeps it out of the quorum denominator — the vote it has no right
      //    to under § 1206(1) reappears in "all votes", and a quorate
      //    assembly publishes as inquorate.
      //
      //    Resolving here at the same instant the recording screen does makes
      //    the published record agree with what the board saw and entered.
      const electorate = await this.electorateService.resolveElectorate(
        vote,
        this.clock.now(),
      );
      await this.voteRepository.saveElectorateUnits(
        tenantId,
        voteId,
        electorate,
      );

      // 3. Close and compute, the same way an ordinary vote ends.
      vote.close(actorMembershipId, this.clock.now());
      const snapshot = await this.resultCalculationService.calculate(
        tenantId,
        voteId,
        vote,
      );
      await this.voteRepository.save(vote);
      await this.voteRepository.saveResults(tenantId, voteId, snapshot);

      const actor = this.auditContext.requireActor();
      await this.auditService.append(
        AssemblyRecordPublishedAuditEvent.build({
          tenantId,
          voteId,
          voteTitle: vote.title,
          presentCount: present.length,
          absentCount: attendance.length - present.length,
          quorumMet: snapshot.quorumMet,
          actor,
          publishedByLabel: await this.labelResolver.resolveActorLabel(actor),
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
