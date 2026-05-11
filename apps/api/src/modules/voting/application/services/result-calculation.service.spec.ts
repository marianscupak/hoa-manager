import { Test, TestingModule } from '@nestjs/testing';

import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  MajorityRuleType,
  QuorumElectorateBasis,
  QuorumMeasure,
  VoteOptionSemantic,
  VoteQuestionType,
} from '@/modules/voting/domain/vote/vote.types';

import { ResultCalculationDomainService } from './result-calculation.service';
import {
  RESULT_CALCULATION_DATA_REPOSITORY,
  ResultCalculationDataRepository,
} from '../ports/result-calculation-data.repository.port';

describe('ResultCalculationDomainService', () => {
  let service: ResultCalculationDomainService;
  let dataRepo: jest.Mocked<ResultCalculationDataRepository>;

  const defaultTenantId = 'tenant-1';
  const defaultVoteId = 'vote-1';
  const qId = 'q1';
  const optYes = 'opt-yes';
  const optNo = 'opt-no';
  const optAbstain = 'opt-abstain';

  const baseVote = {
    id: defaultVoteId,
    tenantId: defaultTenantId,
    ruleset: {
      quorumElectorateBasis: QuorumElectorateBasis.ALL_UNITS,
      quorumMeasure: QuorumMeasure.UNIT_SHARE,
      quorumThreshold: 50,
      majorityRuleType: MajorityRuleType.SIMPLE_MAJORITY,
      majorityThreshold: 50,
      abstainExcludedFromMajorityDenominator: false,
    },
    questions: [
      {
        id: qId,
        type: VoteQuestionType.YES_NO,
        rulesetOverride: null,
        options: [
          { id: optYes, optionKey: VoteOptionSemantic.YES },
          { id: optNo, optionKey: VoteOptionSemantic.NO },
          { id: optAbstain, optionKey: VoteOptionSemantic.ABSTAIN },
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

  describe('Quorum Calculation', () => {
    it('calculates quorum met when weight is above threshold', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.6' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([]);

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        baseVote,
      );

      expect(result.quorumMet).toBe(true); // 60% > 50%
      expect(result.denominatorWeight).toBe(1.0);
      expect(result.participationWeight).toBe(0.6);
    });

    it('calculates quorum failed when weight is below threshold', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.6' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([]);

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        baseVote,
      );

      expect(result.quorumMet).toBe(false); // 40% < 50%
    });

    it('uses ELIGIBLE_UNITS_ONLY correctly', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
        { unitId: 'u2', eligibilityStatus: 'INELIGIBLE', votingWeight: '0.6' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([]);

      const vote = {
        ...baseVote,
        ruleset: {
          ...baseVote.ruleset,
          quorumElectorateBasis: QuorumElectorateBasis.ELIGIBLE_UNITS_ONLY,
          quorumThreshold: 100, // require 100% of eligible
        },
      } as unknown as VoteAggregate;

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        vote,
      );

      // Denominator should only be 0.4 (the eligible unit). Participation is 0.4.
      // So 100% of eligible units participated.
      expect(result.denominatorWeight).toBe(0.4);
      expect(result.quorumMet).toBe(true);
    });

    it('uses UNIT_COUNT measure correctly', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.8' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.1' },
        { unitId: 'u3', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.1' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([]);

      const vote = {
        ...baseVote,
        ruleset: {
          ...baseVote.ruleset,
          quorumMeasure: QuorumMeasure.UNIT_COUNT,
          quorumThreshold: 50, // > 50% of 3 units = 2 units needed
        },
      } as unknown as VoteAggregate;

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        vote,
      );

      expect(result.denominatorUnitCount).toBe(3);
      expect(result.participationUnitCount).toBe(1); // 1/3 is < 50%
      expect(result.quorumMet).toBe(false); // even though they hold 80% weight
    });
  });

  describe('Question Majority Calculation', () => {
    it('calculates SIMPLE_MAJORITY correctly (>50% of cast votes)', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.6' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
        { ballotId: 'b2', unitId: 'u2' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([
        { ballotId: 'b1', questionId: qId, optionId: optYes }, // 0.6 YES
        { ballotId: 'b2', questionId: qId, optionId: optNo }, // 0.4 NO
      ]);

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        baseVote,
      );

      const qRes = result.questionResults[0];
      expect(qRes.majorityDenominatorValue).toBe(1.0);
      expect(qRes.winningOptionId).toBe(optYes);
      expect(qRes.majorityMet).toBe(true);
    });

    it('handles TIE correctly', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.5' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.5' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
        { ballotId: 'b2', unitId: 'u2' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([
        { ballotId: 'b1', questionId: qId, optionId: optYes },
        { ballotId: 'b2', questionId: qId, optionId: optNo },
      ]);

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        baseVote,
      );

      const qRes = result.questionResults[0];
      expect(qRes.winningOptionId).toBeNull();
      expect(qRes.majorityMet).toBe(false);
    });

    it('excludes abstain from majority denominator if configured', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.3' },
        { unitId: 'u3', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.3' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
        { ballotId: 'b2', unitId: 'u2' },
        { ballotId: 'b3', unitId: 'u3' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([
        { ballotId: 'b1', questionId: qId, optionId: optYes }, // 0.4 YES
        { ballotId: 'b2', questionId: qId, optionId: optNo }, // 0.3 NO
        { ballotId: 'b3', questionId: qId, optionId: optAbstain }, // 0.3 ABSTAIN
      ]);

      const vote = {
        ...baseVote,
        ruleset: {
          ...baseVote.ruleset,
          abstainExcludedFromMajorityDenominator: true,
        },
      } as unknown as VoteAggregate;

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        vote,
      );

      const qRes = result.questionResults[0];
      // Denominator should be 0.4 + 0.3 = 0.7 (abstain excluded)
      expect(qRes.majorityDenominatorValue).toBe(0.7);
      expect(qRes.winningOptionId).toBe(optYes);
      expect(qRes.majorityMet).toBe(true); // 0.4 / 0.7 > 50%
    });

    it('requires QUALIFIED_MAJORITY if configured', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.6' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
        { ballotId: 'b2', unitId: 'u2' },
      ]);
      dataRepo.findBallotAnswers.mockResolvedValue([
        { ballotId: 'b1', questionId: qId, optionId: optYes }, // 0.6 YES
        { ballotId: 'b2', questionId: qId, optionId: optNo }, // 0.4 NO
      ]);

      const vote = {
        ...baseVote,
        ruleset: {
          ...baseVote.ruleset,
          majorityRuleType: MajorityRuleType.QUALIFIED_MAJORITY,
          majorityThreshold: 66, // Needs 66%
        },
      } as unknown as VoteAggregate;

      const result = await service.calculate(
        defaultTenantId,
        defaultVoteId,
        vote,
      );

      const qRes = result.questionResults[0];
      // 0.6 YES is not >= 66%, so it's not majority met
      expect(qRes.majorityDenominatorValue).toBe(1.0);
      expect(qRes.majorityMet).toBe(false);
      expect(qRes.winningOptionId).toBeNull(); // Winning option is cleared if majority is not met
    });
  });
});
