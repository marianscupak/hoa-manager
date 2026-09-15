import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { GetVoteParticipationHandler } from './get-vote-participation.handler';
import { GetVoteParticipationQuery } from './get-vote-participation.query';

describe('GetVoteParticipationHandler', () => {
  const readRepo = { findParticipation: jest.fn() };
  let handler: GetVoteParticipationHandler;

  const query = () =>
    new GetVoteParticipationQuery('tenant-1', 'vote-1', 'mem-1');

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetVoteParticipationHandler(readRepo as never, {
      now: () => new Date('2026-09-15T10:00:00Z'),
    });
  });

  it('returns the repository rows unchanged', async () => {
    const units = [
      {
        unitId: 'u1',
        unitNo: 'A1',
        ownerNames: ['Jana Nováková'],
        share: '5/100',
        status: 'NOT_VOTED',
        isOwnUnit: false,
        owners: [],
      },
    ];
    readRepo.findParticipation.mockResolvedValue(units);

    const result = await handler.execute(query());

    expect(readRepo.findParticipation).toHaveBeenCalledWith(
      'tenant-1',
      'vote-1',
      'mem-1',
      expect.any(Date),
    );
    expect(result).toEqual({ units });
  });

  it('throws VoteNotFoundException when the vote has no electorate snapshot', async () => {
    readRepo.findParticipation.mockResolvedValue([]);

    await expect(handler.execute(query())).rejects.toThrow(
      VoteNotFoundException,
    );
  });
});
