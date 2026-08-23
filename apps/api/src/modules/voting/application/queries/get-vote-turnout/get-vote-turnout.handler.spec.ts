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

  const row = (
    unitId: string,
    eligibilityStatus: string,
    weightNum: number,
    ineligibleReason: string | null = null,
  ) => ({
    unitId,
    eligibilityStatus,
    ineligibleReason,
    weightNum,
    weightDen: 100,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVoteTurnoutHandler(dataRepo as never);
  });

  it('computes participation and eligible totals from snapshot and ballots', async () => {
    dataRepo.findElectorateSnapshot.mockResolvedValue([
      row('u1', 'ELIGIBLE', 40),
      row('u2', 'ELIGIBLE', 35),
      row('u3', 'INELIGIBLE', 25, 'NO_REPRESENTATIVE'),
    ]);
    dataRepo.findBallots.mockResolvedValue([{ ballotId: 'b1', unitId: 'u1' }]);

    const result = await handler.execute(
      new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
    );

    expect(result).toEqual({
      participationUnitCount: 1,
      eligibleUnitCount: 2,
      participationWeight: { num: '2', den: '5', decimal: '0.4000' },
      eligibleWeight: { num: '3', den: '4', decimal: '0.7500' },
      totalVotesUnitCount: 3,
      totalVotesWeight: { num: '1', den: '1', decimal: '1.0000' },
      participationPercent: '40.00',
    });
  });

  it('counts ineligible units that cast a ballot in participation', async () => {
    dataRepo.findElectorateSnapshot.mockResolvedValue([
      row('u1', 'ELIGIBLE', 60),
      row('u2', 'INELIGIBLE', 40, 'NO_REPRESENTATIVE'),
    ]);
    dataRepo.findBallots.mockResolvedValue([
      { ballotId: 'b1', unitId: 'u1' },
      { ballotId: 'b2', unitId: 'u2' },
    ]);

    const result = await handler.execute(
      new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
    );

    expect(result.participationUnitCount).toBe(2);
    expect(result.participationWeight.decimal).toBe('1.0000');
    expect(result.participationPercent).toBe('100.00');
  });

  it('throws VoteNotFoundException when no electorate snapshot exists', async () => {
    dataRepo.findElectorateSnapshot.mockResolvedValue([]);

    await expect(
      handler.execute(new GetVoteTurnoutQuery('tenant-1', 'vote-1')),
    ).rejects.toThrow(VoteNotFoundException);
  });

  describe('statutory denominator', () => {
    it('keeps units without a representative in the total, matching the tally', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        row('u1', 'ELIGIBLE', 40),
        row('u2', 'ELIGIBLE', 35),
        row('u3', 'INELIGIBLE', 25, 'NO_REPRESENTATIVE'),
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
      ]);

      const result = await handler.execute(
        new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
      );

      expect(result.totalVotesUnitCount).toBe(3);
      expect(result.totalVotesWeight.decimal).toBe('1.0000');
      expect(result.eligibleUnitCount).toBe(2);
    });

    it('excludes association-owned units from every total', async () => {
      dataRepo.findElectorateSnapshot.mockResolvedValue([
        row('u1', 'ELIGIBLE', 40),
        row('u2', 'ELIGIBLE', 35),
        row('u3', 'INELIGIBLE', 25, 'ASSOCIATION_OWNED'),
      ]);
      dataRepo.findBallots.mockResolvedValue([
        { ballotId: 'b1', unitId: 'u1' },
        // A ballot for an association-owned unit cannot exist, but even if
        // one did it must not count.
        { ballotId: 'b2', unitId: 'u3' },
      ]);

      const result = await handler.execute(
        new GetVoteTurnoutQuery('tenant-1', 'vote-1'),
      );

      expect(result.totalVotesUnitCount).toBe(2);
      expect(result.totalVotesWeight).toEqual({
        num: '3',
        den: '4',
        decimal: '0.7500',
      });
      expect(result.participationUnitCount).toBe(1);
      expect(result.participationPercent).toBe('53.33');
    });
  });
});
