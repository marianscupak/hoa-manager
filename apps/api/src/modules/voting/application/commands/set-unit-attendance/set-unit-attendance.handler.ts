import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  ELECTORATE_SERVICE,
  type ElectorateService,
} from '@/modules/voting/application/ports/electorate-service.port';
import {
  VOTE_ATTENDANCE_REPOSITORY,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { AssemblyAttendanceRecordedAuditEvent } from '@/modules/voting/audit/events/assembly-attendance-recorded.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { isRecordableAtAssembly } from '@/modules/voting/domain/vote/assembly-eligibility';
import { VoteMode, VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  NotAnAssemblyRecordException,
  UnitNotEligibleForAttendanceException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { SetUnitAttendanceCommand } from './set-unit-attendance.command';

@CommandHandler(SetUnitAttendanceCommand)
export class SetUnitAttendanceHandler
  implements ICommandHandler<SetUnitAttendanceCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(VOTE_ATTENDANCE_REPOSITORY)
    private readonly attendanceRepo: VoteAttendanceRepository,
    @Inject(ELECTORATE_SERVICE)
    private readonly electorateService: ElectorateService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: SetUnitAttendanceCommand): Promise<void> {
    const { tenantId, voteId, actorMembershipId, unitId, status } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }
      // Mode before status, so a per-rollam caller gets the accurate reason
      // rather than a confusing complaint about the vote not being a draft.
      if (vote.mode !== VoteMode.ASSEMBLY_RECORD) {
        throw new NotAnAssemblyRecordException();
      }
      if (vote.status !== VoteStatus.DRAFT) {
        throw new VoteNotDraftException();
      }

      if (status === 'PRESENT') {
        // The same electorate the roster offered, or this command would
        // refuse a unit the board can see and click.
        const electorate =
          await this.electorateService.resolveAssemblyElectorate(
            vote,
            this.clock.now(),
          );
        const row = electorate.find((e) => e.unitId === unitId);
        if (!row || !isRecordableAtAssembly(row.ineligibleReason)) {
          throw new UnitNotEligibleForAttendanceException();
        }
      }

      // Absent means nothing was recorded for the unit, so the voter and any
      // ballot go with it. This is the only path that removes a ballot.
      const voterOwnerId = status === 'PRESENT' ? command.voterOwnerId : null;
      const voterNote = status === 'PRESENT' ? command.voterNote : null;

      await this.attendanceRepo.upsert(tenantId, voteId, {
        unitId,
        status,
        voterOwnerId,
        voterNote,
        recordedByMembershipId: actorMembershipId,
      });

      if (status === 'ABSENT') {
        await this.voteRepository.deleteBallotForUnit(tenantId, voteId, unitId);
      }

      const actor = this.auditContext.requireActor();
      await this.auditService.append(
        AssemblyAttendanceRecordedAuditEvent.build({
          tenantId,
          voteId,
          unitId,
          status,
          voteTitle: vote.title,
          unitLabel: await this.labelResolver.resolveUnitLabel(unitId),
          voterLabel: voterOwnerId
            ? await this.labelResolver.resolveOwnerLabel(voterOwnerId)
            : voterNote,
          recordedByLabel: await this.labelResolver.resolveActorLabel(actor),
          actor,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
