import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { Rational } from '@/shared/domain/rational';

import { GetVoteTallyHandler } from './get-vote-tally.handler';
import { GetVoteTallyQuery } from './get-vote-tally.query';

describe('GetVoteTallyHandler', () => {
  const voteRepo = { findById: jest.fn() };
  const resultCalculation = { calculate: jest.fn() };
  let handler: GetVoteTallyHandler;

  const openVote = { id: 'vote-1', status: VoteStatus.OPEN };

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVoteTallyHandler(
      voteRepo as never,
      resultCalculation as never,
    );
  });

  it('maps question results onto the tally DTO', async () => {
    voteRepo.findById.mockResolvedValue(openVote);
    resultCalculation.calculate.mockResolvedValue({
      questionResults: [
        {
          questionId: 'q1',
          majorityDenominator: Rational.from(1, 1),
          optionResults: [
            {
              optionId: 'opt-yes',
              voteWeight: Rational.from(11, 24),
              voteUnitCount: 11,
            },
            {
              optionId: 'opt-no',
              voteWeight: Rational.from(1, 12),
              voteUnitCount: 2,
            },
          ],
        },
      ],
    });

    const result = await handler.execute(
      new GetVoteTallyQuery('tenant-1', 'vote-1'),
    );

    expect(result).toEqual({
      questions: [
        {
          questionId: 'q1',
          majorityDenominator: { num: '1', den: '1', decimal: '1.0000' },
          options: [
            {
              optionId: 'opt-yes',
              voteUnitCount: 11,
              voteWeight: { num: '11', den: '24', decimal: '0.4583' },
            },
            {
              optionId: 'opt-no',
              voteUnitCount: 2,
              voteWeight: { num: '1', den: '12', decimal: '0.0833' },
            },
          ],
        },
      ],
    });
  });

  it('returns a zero denominator when nothing has been cast', async () => {
    voteRepo.findById.mockResolvedValue(openVote);
    resultCalculation.calculate.mockResolvedValue({
      questionResults: [
        {
          questionId: 'q1',
          majorityDenominator: Rational.zero(),
          optionResults: [
            {
              optionId: 'opt-yes',
              voteWeight: Rational.zero(),
              voteUnitCount: 0,
            },
          ],
        },
      ],
    });

    const result = await handler.execute(
      new GetVoteTallyQuery('tenant-1', 'vote-1'),
    );

    expect(result.questions[0].majorityDenominator.num).toBe('0');
  });

  it.each([VoteStatus.DRAFT, VoteStatus.SCHEDULED])(
    'throws VoteNotFoundException for a %s vote',
    async (status) => {
      voteRepo.findById.mockResolvedValue({ id: 'vote-1', status });

      await expect(
        handler.execute(new GetVoteTallyQuery('tenant-1', 'vote-1')),
      ).rejects.toThrow(VoteNotFoundException);
      expect(resultCalculation.calculate).not.toHaveBeenCalled();
    },
  );

  it('throws VoteNotFoundException when the vote does not exist', async () => {
    voteRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetVoteTallyQuery('tenant-1', 'vote-1')),
    ).rejects.toThrow(VoteNotFoundException);
  });
});
