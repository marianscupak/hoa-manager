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
import { isRecordableAtAssembly } from '@/modules/voting/domain/vote/assembly-eligibility';
import { deriveQuestionOutcome } from '@/modules/voting/domain/vote/question-outcome';
import { computeVoteResults } from '@/modules/voting/domain/vote/tally';
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

    // Resolved live rather than from the snapshot: the board records
    // representations while writing the meeting up, and the roster has to show
    // the effect immediately. The snapshot is taken once, at publish.
    //
    // Live means "not frozen", not "as of today". The register is read as it
    // stood on the day of the meeting — those are the owners the minutes name
    // and the ones the roster must offer — and the owner list has to be read
    // at the very same instant, or the screen would offer names the
    // eligibility rules never saw.
    const asOf = vote.scheduledFrom ?? this.clock.now();
    const [electorate, context, attendance] = await Promise.all([
      this.electorateService.resolveAssemblyElectorate(vote, this.clock.now()),
      this.voteReadRepository.findAssemblyUnitContext(tenantId, voteId, asOf),
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
        // What the board can act on, not what a per-rollam electorate would
        // say: a missing common representative is settled in the room.
        eligibility: isRecordableAtAssembly(row.ineligibleReason)
          ? 'ELIGIBLE'
          : 'INELIGIBLE',
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

    // The same `computeVoteResults` the publish path runs, over the ballots
    // entered so far. The review screen promises the board an outcome before
    // it commits to one, and that promise only holds if a single function
    // produces both answers — the tie rule, the exclusion of abstentions from
    // the winner and the denominator basis all live in there.
    const ruleset = vote.ruleset;
    const withBallot = units.filter((u) => u.answers.length > 0);
    const tally = ruleset
      ? computeVoteResults({
          mode: vote.mode,
          quorum: ruleset.quorum,
          questions: vote.questions.map((question) => {
            const effective = question.rulesetOverride ?? ruleset;
            return {
              id: question.id,
              options: question.options.map((option) => ({
                id: option.id,
                optionKey: option.optionKey,
              })),
              rules: {
                basis: effective.majorityDenominatorBasis,
                threshold: effective.majorityThreshold,
                comparator: effective.majorityComparator,
              },
            };
          }),
          electorate,
          // One synthetic ballot per unit that has answers: the tally only
          // uses the id to join an answer back to its unit, and emitting one
          // per *present* unit instead would overstate participation.
          ballots: withBallot.map((u) => ({
            ballotId: u.unitId,
            unitId: u.unitId,
          })),
          answers: withBallot.flatMap((u) =>
            u.answers.map((a) => ({ ballotId: u.unitId, ...a })),
          ),
        })
      : null;

    const tallyByQuestion = new Map(
      (tally?.questionResults ?? []).map((q) => [q.questionId, q]),
    );

    const questions = vote.questions.map((question) => {
      const result = tallyByQuestion.get(question.id) ?? null;
      const optionResults = new Map(
        (result?.optionResults ?? []).map((o) => [o.optionId, o]),
      );
      const winningOptionKey =
        question.options.find((o) => o.id === result?.winningOptionId)
          ?.optionKey ?? null;

      return {
        questionId: question.id,
        title: question.title,
        type: question.type,
        options: question.options.map((option) => {
          const tallied = optionResults.get(option.id);
          return {
            optionId: option.id,
            optionKey: option.optionKey,
            label: option.label,
            weight: toFractionDto(tallied?.voteWeight ?? Rational.zero()),
            unitCount: tallied?.voteUnitCount ?? 0,
          };
        }),
        preview: result
          ? {
              // Quorum is the attendance the screen shows, not the tally's
              // ballot-based participation. The two diverge while the board
              // types — every question would read "not decided" until the
              // last ballot landed — and coincide at publish, which is what
              // the completeness gate is for. A ruleset with no quorum rule
              // passes null through, the way `tally.ts` does.
              outcome: deriveQuestionOutcome({
                questionType: question.type,
                quorumMet: ruleset?.quorum ? quorate : null,
                majorityMet: result.majorityMet,
                winningOptionKey,
              }),
              majorityMet: result.majorityMet,
              winningOptionId: result.winningOptionId,
              majorityThreshold: result.majorityThreshold,
              majorityComparator: result.majorityComparator,
              majorityDenominator: toFractionDto(result.majorityDenominator),
            }
          : null,
      };
    });

    return {
      voteTitle: vote.title,
      status: vote.status,
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
