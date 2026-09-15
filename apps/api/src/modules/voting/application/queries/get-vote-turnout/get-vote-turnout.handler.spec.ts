import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { Rational } from '@/shared/domain/rational';

import { GetVoteTurnoutHandler } from './get-vote-turnout.handler';
import { GetVoteTurnoutQuery } from './get-vote-turnout.query';

describe('GetVoteTurnoutHandler', () => {
  const voteRepo = { findById: jest.fn() };
  const resultCalculation = { calculate: jest.fn() };
  let handler: GetVoteTurnoutHandler;

  const openVote = { id: 'vote-1', status: VoteStatus.OPEN };

  const tally = (overrides: Record<string, unknown> = {}) => ({
    quorumMet: true,
    participationWeight: Rational.from(2, 5),
    participationUnitCount: 1,
    eligibleWeight: Rational.from(3, 4),
    eligibleUnitCount: 2,
    totalVotesWeight: Rational.one(),
    totalVotesUnitCount: 3,
    questionResults: [],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVoteTurnoutHandler(
      voteRepo as never,
      resultCalculation as never,
    );
  });

  it('maps the tally result onto the turnout DTO', async () => {
    voteRepo.findById.mockResolvedValue(openVote);
    resultCalculation.calculate.mockResolvedValue(tally());

    const result = await handler.execute(
      new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
    );

    expect(resultCalculation.calculate).toHaveBeenCalledWith(
      'tenant-1',
      'vote-1',
      openVote,
    );
    expect(result).toEqual({
      participationUnitCount: 1,
      eligibleUnitCount: 2,
      participationWeight: { num: '2', den: '5', decimal: '0.4000' },
      eligibleWeight: { num: '3', den: '4', decimal: '0.7500' },
      totalVotesUnitCount: 3,
      totalVotesWeight: { num: '1', den: '1', decimal: '1.0000' },
      participationPercent: '40.00',
      quorumMet: true,
    });
  });

  it('passes a null quorumMet through for per-rollam votes', async () => {
    voteRepo.findById.mockResolvedValue(openVote);
    resultCalculation.calculate.mockResolvedValue(
      tally({ quorumMet: null }),
    );

    const result = await handler.execute(
      new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
    );

    expect(result.quorumMet).toBeNull();
  });

  it('throws VoteNotFoundException when the vote does not exist', async () => {
    voteRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetVoteTurnoutQuery('tenant-1', 'vote-1')),
    ).rejects.toThrow(VoteNotFoundException);
    expect(resultCalculation.calculate).not.toHaveBeenCalled();
  });

  it.each([VoteStatus.DRAFT, VoteStatus.SCHEDULED])(
    'throws VoteNotFoundException for a %s vote, which has no electorate snapshot',
    async (status) => {
      voteRepo.findById.mockResolvedValue({ id: 'vote-1', status });

      await expect(
        handler.execute(new GetVoteTurnoutQuery('tenant-1', 'vote-1')),
      ).rejects.toThrow(VoteNotFoundException);
      expect(resultCalculation.calculate).not.toHaveBeenCalled();
    },
  );
});
