import { type ElectorateService } from '@/modules/voting/application/ports/electorate-service.port';
import {
  type AttendanceRow,
  type VoteAttendanceRepository,
} from '@/modules/voting/application/ports/vote-attendance.repository.port';
import {
  type AssemblyUnitContext,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { type VoteWriteRepository } from '@/modules/voting/application/ports/vote-write.repository.port';
import { type VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  MajorityDenominatorBasis,
  MajorityRuleType,
  QuorumMeasure,
  ThresholdComparator,
  VoteMode,
  VoteQuestionType,
  VoteStatus,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';
import { type Clock } from '@/shared/application/ports/clock.port';

import { GetAssemblyRecordHandler } from './get-assembly-record.handler';
import { GetAssemblyRecordQuery } from './get-assembly-record.query';

const RULESET = {
  weightBasis: VoteWeightBasis.UNIT_SHARE,
  quorum: {
    measure: QuorumMeasure.UNIT_SHARE,
    threshold: { num: 1, den: 2 },
    comparator: ThresholdComparator.STRICT_GREATER,
  },
  majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
  majorityDenominatorBasis: MajorityDenominatorBasis.VOTES_CAST,
  majorityThreshold: { num: 1, den: 2 },
  majorityComparator: ThresholdComparator.STRICT_GREATER,
  allowAbstain: true,
  acknowledgedNonStatutory: false,
};

type UnitSpec = {
  unitId: string;
  weight?: [number, number];
  ineligibleReason?: ElectorateIneligibleReason;
  answers?: { questionId: string; optionId: string }[];
};

function build(options: {
  units: UnitSpec[];
  attendance?: AttendanceRow[];
  weightBasis?: VoteWeightBasis;
  /** A vote can reach the recording screen before its rules are set. */
  noRuleset?: boolean;
}) {
  const vote = {
    id: 'vote-1',
    tenantId: 'tenant-1',
    title: 'Assembly 12 Sep',
    mode: VoteMode.ASSEMBLY_RECORD,
    status: VoteStatus.DRAFT,
    scheduledFrom: MEETING_DATE,
    ruleset: options.noRuleset
      ? null
      : { ...RULESET, weightBasis: options.weightBasis ?? RULESET.weightBasis },
    questions: [
      {
        id: 'q1',
        title: 'Approve the budget?',
        type: VoteQuestionType.YES_NO,
        options: [
          { id: 'o-yes', optionKey: 'YES', label: 'Ano' },
          { id: 'o-no', optionKey: 'NO', label: 'Ne' },
          { id: 'o-abs', optionKey: 'ABSTAIN', label: 'Zdržel se' },
        ],
      },
    ],
  } as unknown as VoteAggregate;

  const calls = { contextReadAt: null as Date | null };

  const context: AssemblyUnitContext[] = options.units.map((u) => ({
    unitId: u.unitId,
    unitNo: u.unitId.toUpperCase(),
    owners: [
      { ownerId: `owner-${u.unitId}`, displayName: `Owner ${u.unitId}` },
    ],
    answers: u.answers ?? [],
  }));

  const handler = new GetAssemblyRecordHandler(
    {
      findById: jest.fn().mockResolvedValue(vote),
    } as unknown as VoteWriteRepository,
    {
      findAssemblyUnitContext: jest.fn(
        async (_t: string, _v: string, at: Date) => {
          calls.contextReadAt = at;
          return context;
        },
      ),
    } as unknown as VoteReadRepository,
    {
      findByVote: jest.fn(async () => options.attendance ?? []),
    } as unknown as VoteAttendanceRepository,
    {
      resolveAssemblyElectorate: jest.fn(async () =>
        options.units.map((u) => ({
          unitId: u.unitId,
          eligibilityStatus: u.ineligibleReason
            ? ElectorateEligibilityStatus.INELIGIBLE
            : ElectorateEligibilityStatus.ELIGIBLE,
          ineligibleReason: u.ineligibleReason ?? null,
          weightNum: u.weight?.[0] ?? 1,
          weightDen: u.weight?.[1] ?? 4,
          representativeMembershipId: null,
        })),
      ),
    } as unknown as ElectorateService,
    { now: () => new Date('2026-09-16T12:00:00Z') } as Clock,
  );

  return { handler, calls };
}

const MEETING_DATE = new Date('2026-09-12T18:30:00Z');

const query = () => new GetAssemblyRecordQuery('tenant-1', 'vote-1');

const present = (unitId: string): AttendanceRow => ({
  unitId,
  status: 'PRESENT',
  voterOwnerId: `owner-${unitId}`,
  voterNote: null,
});

describe('GetAssemblyRecordHandler', () => {
  it('reports both the weight and the unit count for every option', async () => {
    // The running count leads with whichever metric decides the vote, so the
    // read model carries both and lets the screen choose.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          weight: [1, 4],
          answers: [{ questionId: 'q1', optionId: 'o-yes' }],
        },
        {
          unitId: 'u2',
          weight: [3, 4],
          answers: [{ questionId: 'q1', optionId: 'o-no' }],
        },
      ],
      attendance: [present('u1'), present('u2')],
    });

    const result = await handler.execute(query());
    const options = result.questions[0].options;

    expect(
      options.find((o: { optionKey: string }) => o.optionKey === 'YES'),
    ).toMatchObject({
      unitCount: 1,
      weight: { num: '1', den: '4' },
    });
    expect(
      options.find((o: { optionKey: string }) => o.optionKey === 'NO'),
    ).toMatchObject({
      unitCount: 1,
      weight: { num: '3', den: '4' },
    });
  });

  it('counts a unit the board has not reached as awaiting entry, not absent', async () => {
    const { handler } = build({
      units: [{ unitId: 'u1' }, { unitId: 'u2' }, { unitId: 'u3' }],
      attendance: [
        present('u1'),
        { unitId: 'u2', status: 'ABSENT', voterOwnerId: null, voterNote: null },
      ],
    });

    const result = await handler.execute(query());

    expect(result.totals).toMatchObject({
      presentUnitCount: 1,
      absentUnitCount: 1,
      unitsAwaitingEntry: 1,
    });
    expect(
      result.units.find((u: { unitId: string }) => u.unitId === 'u3')!
        .attendance,
    ).toBeNull();
  });

  it('counts a present unit with no ballot as awaiting entry', async () => {
    // This is exactly what the publish gate blocks on.
    const { handler } = build({
      units: [{ unitId: 'u1', answers: [] }],
      attendance: [present('u1')],
    });

    const result = await handler.execute(query());

    expect(result.totals.unitsAwaitingEntry).toBe(1);
  });

  it('lets the board record a unit that has no common representative', async () => {
    // The pre-agreed representative is a per-rollam requirement. At a meeting
    // the co-owners settle it in the room, and a sole owner with no user
    // account is never a candidate at all — both would otherwise be
    // unrecordable, which is most of a real building.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
        },
      ],
    });

    const result = await handler.execute(query());

    expect(result.units[0]).toMatchObject({
      eligibility: 'ELIGIBLE',
      ineligibleReason: 'NO_REPRESENTATIVE',
    });
    expect(result.totals.ineligibleUnitCount).toBe(0);
  });

  it('still reports a unit with no ownership on record as ineligible', async () => {
    // Nobody could have stood up for it, and no attestation fixes that.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          ineligibleReason: ElectorateIneligibleReason.MISSING_OWNERSHIP,
        },
      ],
    });

    const result = await handler.execute(query());

    expect(result.units[0].eligibility).toBe('INELIGIBLE');
    expect(result.totals.ineligibleUnitCount).toBe(1);
  });

  it('measures presence against every countable unit, including ineligible ones', async () => {
    // The quorum denominator is all the votes in the building; a unit with no
    // common representative still counts toward it even though it cannot vote.
    const { handler } = build({
      units: [
        { unitId: 'u1', weight: [1, 2] },
        {
          unitId: 'u2',
          weight: [1, 2],
          ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
        },
      ],
      attendance: [present('u1')],
    });

    const result = await handler.execute(query());

    expect(result.totals.allVotesWeight).toMatchObject({ num: '1', den: '1' });
    expect(result.totals.presentWeight).toMatchObject({ num: '1', den: '2' });
    // More than half is required, and exactly half is not more than half.
    expect(result.totals.quorate).toBe(false);
  });

  it('reports the assembly as quorate once more than half the votes are present', async () => {
    const { handler } = build({
      units: [
        { unitId: 'u1', weight: [3, 4] },
        { unitId: 'u2', weight: [1, 4] },
      ],
      attendance: [present('u1')],
    });

    const result = await handler.execute(query());

    expect(result.totals.quorate).toBe(true);
  });

  it('previews the outcome publishing would write', async () => {
    // The review screen tells the board "Approved" before it commits. That
    // promise only holds because the same `computeVoteResults` produces both
    // this preview and the published result.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          weight: [3, 4],
          answers: [{ questionId: 'q1', optionId: 'o-yes' }],
        },
        {
          unitId: 'u2',
          weight: [1, 4],
          answers: [{ questionId: 'q1', optionId: 'o-no' }],
        },
      ],
      attendance: [present('u1'), present('u2')],
    });

    const result = await handler.execute(query());

    expect(result.questions[0].preview).toMatchObject({
      outcome: 'APPROVED',
      majorityMet: true,
      winningOptionId: 'o-yes',
      // Votes cast, not all votes: both units voted, so the two coincide.
      majorityDenominator: { num: '1', den: '1' },
    });
  });

  it('reads a yes/no question the NO side won as rejected', async () => {
    // `majorityMet` alone never means approved — the winning option decides.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          weight: [3, 4],
          answers: [{ questionId: 'q1', optionId: 'o-no' }],
        },
      ],
      attendance: [present('u1')],
    });

    const result = await handler.execute(query());

    expect(result.questions[0].preview).toMatchObject({
      outcome: 'REJECTED',
      majorityMet: true,
      winningOptionId: 'o-no',
    });
  });

  it('measures the preview quorum by attendance, not by ballots entered', async () => {
    // Both units are in the room, so the assembly is quorate — but only one
    // ballot is typed in so far. Judging quorum by the ballots would read
    // every question as not decided until the last one landed.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          weight: [1, 4],
          answers: [{ questionId: 'q1', optionId: 'o-yes' }],
        },
        { unitId: 'u2', weight: [3, 4] },
      ],
      attendance: [present('u1'), present('u2')],
    });

    const result = await handler.execute(query());

    expect(result.totals.quorate).toBe(true);
    expect(result.questions[0].preview!.outcome).toBe('APPROVED');
  });

  it('leaves every question undecided while the assembly is short of quorum', async () => {
    // The one unit in the room voted yes unanimously, and it still decides
    // nothing.
    const { handler } = build({
      units: [
        {
          unitId: 'u1',
          weight: [1, 4],
          answers: [{ questionId: 'q1', optionId: 'o-yes' }],
        },
        { unitId: 'u2', weight: [3, 4] },
      ],
      attendance: [present('u1')],
    });

    const result = await handler.execute(query());

    expect(result.totals.quorate).toBe(false);
    expect(result.questions[0].preview).toMatchObject({
      outcome: 'NOT_DECIDED',
      majorityMet: true,
    });
  });

  it('has no preview before the vote has a ruleset', async () => {
    // Nothing to compare a majority against, so the review screen shows no
    // verdicts rather than inventing a threshold.
    const { handler } = build({ units: [{ unitId: 'u1' }], noRuleset: true });

    const result = await handler.execute(query());

    expect(result.questions[0].preview).toBeNull();
  });

  it('offers the owners who held the units on the day of the meeting', async () => {
    // The roster's owner list and the eligibility rules have to be read at one
    // instant. They were not: eligibility came from the meeting date and the
    // names from today, so the board was offered people the rules had never
    // seen — and the published record disagreed with the screen it was
    // entered on.
    const { handler, calls } = build({ units: [{ unitId: 'u1' }] });

    const result = await handler.execute(query());

    expect(calls.contextReadAt).toEqual(MEETING_DATE);
    expect(result.units[0].owners).toHaveLength(1);
  });

  it('carries the meeting date and the weight basis the screen needs', async () => {
    const { handler } = build({
      units: [{ unitId: 'u1' }],
      weightBasis: VoteWeightBasis.ONE_UNIT_ONE_VOTE,
    });

    const result = await handler.execute(query());

    expect(result.weightBasis).toBe('ONE_UNIT_ONE_VOTE');
    expect(result.meetingDate).toBe('2026-09-12T18:30:00.000Z');
  });
});
