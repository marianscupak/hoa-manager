import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteTurnoutHandler } from './get-vote-turnout.handler';
import { GetVoteTurnoutQuery } from './get-vote-turnout.query';

describe('GetVoteTurnoutHandler', () => {
  const dataRepo = {
    findElectorateSnapshot: jest.fn(),
    findBallots: jest.fn(),
    findBallotAnswers: jest.fn(),
  };
  const voteReadRepo = {
    findDetailById: jest.fn(),
  };
  let handler: GetVoteTurnoutHandler;

  const withBasis = (quorumElectorateBasis: string | null) =>
    quorumElectorateBasis === null
      ? { ruleset: null }
      : { ruleset: { quorumElectorateBasis } };

  beforeEach(() => {
    jest.clearAllMocks();
    voteReadRepo.findDetailById.mockResolvedValue(withBasis('ALL_UNITS'));
    handler = new GetVoteTurnoutHandler(
      dataRepo as never,
      voteReadRepo as never,
    );
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
      denominatorUnitCount: 3,
      denominatorWeight: 1,
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

  describe('quorum denominator', () => {
    beforeEach(() => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        { unitId: 'u1', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.4' },
        { unitId: 'u2', eligibilityStatus: 'ELIGIBLE', votingWeight: '0.35' },
        { unitId: 'u3', eligibilityStatus: 'INELIGIBLE', votingWeight: '0.25' },
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
      ]);
    });

    it('counts every unit, including ineligible ones, on an ALL_UNITS basis', async () => {
      voteReadRepo.findDetailById.mockResolvedValue(withBasis('ALL_UNITS'));

      const result = await handler.execute(
        new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
      );

      expect(result.denominatorUnitCount).toBe(3);
      expect(result.denominatorWeight).toBe(1);
      expect(result.eligibleUnitCount).toBe(2);
    });

    it('counts only eligible units on an ELIGIBLE_UNITS_ONLY basis', async () => {
      voteReadRepo.findDetailById.mockResolvedValue(
        withBasis('ELIGIBLE_UNITS_ONLY'),
      );

      const result = await handler.execute(
        new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
      );

      expect(result.denominatorUnitCount).toBe(result.eligibleUnitCount);
      expect(result.denominatorWeight).toBe(result.eligibleWeight);
      expect(result.denominatorUnitCount).toBe(2);
      expect(result.denominatorWeight).toBe(0.75);
    });

    it('falls back to ALL_UNITS when the vote has no ruleset', async () => {
      voteReadRepo.findDetailById.mockResolvedValue(withBasis(null));

      const result = await handler.execute(
        new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
      );

      expect(result.denominatorUnitCount).toBe(3);
      expect(result.denominatorWeight).toBe(1);
    });

    it('falls back to ALL_UNITS when the vote detail cannot be read', async () => {
      voteReadRepo.findDetailById.mockResolvedValue(null);

      const result = await handler.execute(
        new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
      );

      expect(result.denominatorUnitCount).toBe(3);
      expect(result.denominatorWeight).toBe(1);
    });
  });
});
