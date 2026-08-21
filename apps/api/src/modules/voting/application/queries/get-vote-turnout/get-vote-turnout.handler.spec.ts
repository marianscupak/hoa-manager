import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteTurnoutHandler } from './get-vote-turnout.handler';
import { GetVoteTurnoutQuery } from './get-vote-turnout.query';

describe('GetVoteTurnoutHandler', () => {
  const dataRepo = {
    findElectorateSnapshot: jest.fn(),
    findBallots: jest.fn(),
    findBallotAnswers: jest.fn(),
  };
  let handler: GetVoteTurnoutHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVoteTurnoutHandler(dataRepo);
  });

  it('computes participation and eligible totals from snapshot and ballots', async () => {
    dataRepo.findElectorateSnapshot.mockResolvedValue([
      { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
      { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.35' },
      { unitId: 'u3', eligibilityStatus: 'INELIGIBLE', votingWeight: '0.25' },
    ]);
    dataRepo.findBallots.mockResolvedValue([{ ballotId: 'b1', unitId: 'u1' }]);

    const result = await handler.execute(
      new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
    );

    expect(result).toEqual({
      participationUnitCount: 1,
      eligibleUnitCount: 2,
      participationWeight: 0.4,
      eligibleWeight: 0.75,
    });
  });

  it('counts ineligible units that cast a ballot in participation', async () => {
    dataRepo.findElectorateSnapshot.mockResolvedValue([
      { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.6' },
      { unitId: 'u2', eligibilityStatus: 'INELIGIBLE', votingWeight: '0.4' },
    ]);
    dataRepo.findBallots.mockResolvedValue([
      { ballotId: 'b1', unitId: 'u1' },
      { ballotId: 'b2', unitId: 'u2' },
    ]);

    const result = await handler.execute(
      new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
    );

    expect(result.participationUnitCount).toBe(2);
    expect(result.participationWeight).toBe(1);
  });

  it('throws VoteNotFoundException when no electorate snapshot exists', async () => {
    dataRepo.findElectorateSnapshot.mockResolvedValue([]);

    await expect(
      handler.execute(new GetVoteTurnoutQuery('tenant-1', 'vote-1')),
    ).rejects.toThrow(VoteNotFoundException);
  });
});
