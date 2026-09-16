import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  AssemblyRecordResponseDto,
  toFractionDto,
} from '@/modules/voting/api/dto/vote.dto';
import {
  ELECTORATE_SERVICE,
  type ElectorateService,
} from '@/modules/voting/application/ports/electorate-service.port';
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
import {
  ElectorateIneligibleReason,
  QuorumMeasure,
  type QuorumRule,
  ThresholdComparator,
  VoteMode,
} from '@/modules/voting/domain/vote/vote.types';
import {
  NotAnAssemblyRecordException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { Rational } from '@/shared/domain/rational';

import { GetAssemblyRecordQuery } from './get-assembly-record.query';

@QueryHandler(GetAssemblyRecordQuery)
export class GetAssemblyRecordHandler
  implements IQueryHandler<GetAssemblyRecordQuery>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(VOTE_ATTENDANCE_REPOSITORY)
    private readonly attendanceRepo: VoteAttendanceRepository,
    @Inject(ELECTORATE_SERVICE)
    private readonly electorateService: ElectorateService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    query: GetAssemblyRecordQuery,
  ): Promise<AssemblyRecordResponseDto> {
    const { tenantId, voteId } = query;

    const vote = await this.voteRepository.findById(tenantId, voteId);
    if (!vote) {
      throw new VoteNotFoundException();
    }
    if (vote.mode !== VoteMode.ASSEMBLY_RECORD) {
      throw new NotAnAssemblyRecordException();
    }

    const now = this.clock.now();
    // Resolved live, not from the snapshot: the board records representations
    // while writing the meeting up, and the roster has to show the effect
    // immediately. The snapshot is taken once, at publish.
    const [electorate, context, attendance] = await Promise.all([
      this.electorateService.resolveElectorate(vote, now),
      this.voteReadRepository.findAssemblyUnitContext(tenantId, voteId, now),
      this.attendanceRepo.findByVote(tenantId, voteId),
    ]);

    const contextByUnit = new Map(context.map((c) => [c.unitId, c]));
    const attendanceByUnit = new Map(attendance.map((a) => [a.unitId, a]));
    const questionCount = vote.questions.length;

    // "Countable" mirrors `tally.ts`: everything except units the association
    // owns, so a unit with no common representative still counts toward the
    // quorum denominator even though it cannot vote.
    const countable = electorate.filter(
      (e) => e.ineligibleReason !== ElectorateIneligibleReason.ASSOCIATION_OWNED,
    );
    const weightOf = (unitId: string) => {
      const row = countable.find((e) => e.unitId === unitId);
      return row ? Rational.from(row.weightNum, row.weightDen) : Rational.zero();
    };

    const units = countable.map((row) => {
      const ctx = contextByUnit.get(row.unitId);
      const att = attendanceByUnit.get(row.unitId) ?? null;
      return {
        unitId: row.unitId,
        unitNo: ctx?.unitNo ?? '',
        owners: ctx?.owners ?? [],
        share: toFractionDto(Rational.from(row.weightNum, row.weightDen)),
        eligibility: row.eligibilityStatus,
        ineligibleReason: row.ineligibleReason,
        attendance: att?.status ?? null,
        voterOwnerId: att?.voterOwnerId ?? null,
        voterNote: att?.voterNote ?? null,
        answers: ctx?.answers ?? [],
      };
    });

    const presentUnits = units.filter((u) => u.attendance === 'PRESENT');
    const allVotesWeight = Rational.sum(
      countable.map((e) => Rational.from(e.weightNum, e.weightDen)),
    );
    const presentWeight = Rational.sum(
      presentUnits.map((u) => weightOf(u.unitId)),
    );

    const quorum = vote.ruleset?.quorum ?? null;
    const quorate = quorum
      ? this.meetsQuorum(
          quorum,
          presentWeight,
          allVotesWeight,
          presentUnits.length,
          countable.length,
        )
      : false;

    const questions = vote.questions.map((question) => ({
      questionId: question.id,
      title: question.title,
      options: question.options.map((option) => {
        const voters = units.filter((u) =>
          u.answers.some((a) => a.optionId === option.id),
        );
        return {
          optionId: option.id,
          optionKey: option.optionKey,
          label: option.label,
          weight: toFractionDto(
            Rational.sum(voters.map((u) => weightOf(u.unitId))),
          ),
          unitCount: voters.length,
        };
      }),
    }));

    return {
      voteTitle: vote.title,
      meetingDate: vote.scheduledFrom?.toISOString() ?? null,
      weightBasis: vote.ruleset?.weightBasis ?? 'UNIT_SHARE',
      totals: {
        allVotesWeight: toFractionDto(allVotesWeight),
        presentWeight: toFractionDto(presentWeight),
        presentUnitCount: presentUnits.length,
        absentUnitCount: units.filter((u) => u.attendance === 'ABSENT').length,
        ineligibleUnitCount: units.filter((u) => u.eligibility === 'INELIGIBLE')
          .length,
        // A present unit is awaiting entry until it has answered every
        // question; a unit nobody has looked at yet is not counted here,
        // because leaving it unset is the same as absent for the result.
        unitsAwaitingEntry: presentUnits.filter(
          (u) => u.answers.length < questionCount,
        ).length,
        quorate,
      },
      units,
      questions,
    } as AssemblyRecordResponseDto;
  }

  /** Mirrors the quorum comparison `tally.ts` makes at publish time. */
  private meetsQuorum(
    quorum: QuorumRule,
    presentWeight: Rational,
    allVotesWeight: Rational,
    presentCount: number,
    countableCount: number,
  ): boolean {
    const [value, total] =
      quorum.measure === QuorumMeasure.UNIT_SHARE
        ? [presentWeight, allVotesWeight]
        : [Rational.from(presentCount, 1), Rational.from(countableCount, 1)];

    if (total.isZero()) return false;

    const bar = Rational.from(quorum.threshold.num, quorum.threshold.den).mul(
      total,
    );
    return quorum.comparator === ThresholdComparator.AT_LEAST
      ? value.gte(bar)
      : value.gt(bar);
  }
}
