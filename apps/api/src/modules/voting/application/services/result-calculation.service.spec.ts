import { Test, TestingModule } from '@nestjs/testing';

import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  MajorityDenominatorBasis,
  MajorityRuleType,
  ThresholdComparator,
  VoteMode,
  VoteOptionSemantic,
  VoteQuestionType,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';
import { Rational } from '@/shared/domain/rational';

import { ResultCalculationDomainService } from './result-calculation.service';
import {
  RESULT_CALCULATION_DATA_REPOSITORY,
  ResultCalculationDataRepository,
} from '../ports/result-calculation-data.repository.port';

/**
 * The tally rules themselves live in (and are covered by) `tally.spec.ts`.
 * This service is only the wiring: snapshot + ballot rows in, TallyResult out.
 */
describe('ResultCalculationDomainService', () => {
  let service: ResultCalculationDomainService;
  let dataRepo: jest.Mocked<ResultCalculationDataRepository>;

  const defaultTenantId = 'tenant-1';
  const defaultVoteId = 'vote-1';
  const qId = 'q1';
  const optYes = 'opt-yes';
  const optNo = 'opt-no';

  const perRollamVote = {
    id: defaultVoteId,
    tenantId: defaultTenantId,
    mode: VoteMode.PER_ROLLAM,
    ruleset: {
      weightBasis: VoteWeightBasis.UNIT_SHARE,
      quorum: null,
      majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
      majorityDenominatorBasis: MajorityDenominatorBasis.ALL_VOTES,
      majorityThreshold: { num: 1, den: 2 },
      majorityComparator: ThresholdComparator.STRICT_GREATER,
      allowAbstain: false,
      acknowledgedNonStatutory: false,
    },
    questions: [
      {
        id: qId,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: undefined,
        options: [
          { id: optYes, optionKey: VoteOptionSemantic.YES },
          { id: optNo, optionKey: VoteOptionSemantic.NO },
        ],
      },
    ],
  } as unknown as VoteAggregate;

  beforeEach(async () => {
    dataRepo = {
      findElectorateSnapshot: jest.fn(),
      findBallots: jest.fn(),
      findBallotAnswers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultCalculationDomainService,
        {
          provide: RESULT_CALCULATION_DATA_REPOSITORY,
          useValue: dataRepo,
        },
      ],
    }).compile();

    service = module.get<ResultCalculationDomainService>(
      ResultCalculationDomainService,
    );
  });

  it('maps repository rows into the tally and returns its result', async () => {
    // 35 / 25 / 40 shares; u1 + u2 vote YES = 60 % of all votes.
    dataRepo.findElectorateSnapshot.mockResolvedValue([
      {
        unitId: 'u1',
        eligibilityStatus: 'ELIGIBLE',
        ineligibleReason: null,
        weightNum: 35,
        weightDen: 100,
      },
      {
        unitId: 'u2',
        eligibilityStatus: 'ELIGIBLE',
        ineligibleReason: null,
        weightNum: 25,
        weightDen: 100,
      },
      {
        unitId: 'u3',
        eligibilityStatus: 'ELIGIBLE',
        ineligibleReason: null,
        weightNum: 40,
        weightDen: 100,
      },
    ]);
    dataRepo.findBallots.mockResolvedValue([
      { ballotId: 'b1', unitId: 'u1' },
      { ballotId: 'b2', unitId: 'u2' },
    ]);
    dataRepo.findBallotAnswers.mockResolvedValue([
      { ballotId: 'b1', questionId: qId, optionId: optYes },
      { ballotId: 'b2', questionId: qId, optionId: optYes },
    ]);

    const result = await service.calculate(
      defaultTenantId,
      defaultVoteId,
      perRollamVote,
    );

    expect(dataRepo.findBallotAnswers).toHaveBeenCalledWith(['b1', 'b2']);
    // Per rollam has no quorum by law.
    expect(result.quorumMet).toBeNull();
    expect(result.participationWeight.eq(Rational.from(3, 5))).toBe(true);
    expect(result.participationUnitCount).toBe(2);
    expect(result.totalVotesWeight.eq(Rational.one())).toBe(true);
    expect(result.totalVotesUnitCount).toBe(3);

    const [qRes] = result.questionResults;
    expect(qRes.majorityMet).toBe(true);
    expect(qRes.winningOptionId).toBe(optYes);
    expect(qRes.majorityDenominator.eq(Rational.one())).toBe(true);
    expect(
      qRes.optionResults
        .find((o) => o.optionId === optYes)!
        .voteWeight.eq(Rational.from(3, 5)),
    ).toBe(true);
  });

  it('throws when the vote has no ruleset', async () => {
    await expect(
      service.calculate(defaultTenantId, defaultVoteId, {
        ...perRollamVote,
        ruleset: undefined,
      } as VoteAggregate),
    ).rejects.toThrow('has no ruleset');
  });
});
