import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { type VoteListItemResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { type VoteReadRepository } from '@/modules/voting/application/ports/vote-read.repository.port';

import { GetVotesHandler } from './get-votes.handler';
import { GetVotesQuery } from './get-votes.query';

describe('GetVotesHandler', () => {
  let voteReadRepository: jest.Mocked<VoteReadRepository>;
  let handler: GetVotesHandler;

  beforeEach(() => {
    voteReadRepository = {
      findVotes: jest.fn(),
      findVoterSummariesForVotes: jest.fn(),
      findQuestionOutcomesForVotes: jest.fn(),
    } as unknown as jest.Mocked<VoteReadRepository>;
    handler = new GetVotesHandler(voteReadRepository, {
      now: () => new Date('2026-09-04T10:00:00Z'),
    });
  });

  it('attaches questionOutcomes from the map to a CLOSED vote', async () => {
    const closedVote = {
      id: 'v1',
      title: 't',
      status: 'CLOSED',
      mode: 'PER_ROLLAM',
    } as unknown as VoteListItemResponseDto;
    voteReadRepository.findVotes.mockResolvedValue([closedVote]);
    voteReadRepository.findVoterSummariesForVotes.mockResolvedValue(new Map());
    const outcomes = [
      {
        questionId: 'q1',
        title: 'Question 1',
        outcome: 'APPROVED' as const,
        winningOptionLabel: 'Yes',
      },
    ];
    voteReadRepository.findQuestionOutcomesForVotes.mockResolvedValue(
      new Map([['v1', outcomes]]),
    );

    const result = await handler.execute(
      new GetVotesQuery(
        'tenant-1',
        [TenantMembershipRole.ADMIN],
        'm1',
        undefined,
      ),
    );

    expect(result[0].questionOutcomes).toEqual(outcomes);
    expect(
      voteReadRepository.findQuestionOutcomesForVotes,
    ).toHaveBeenCalledWith('tenant-1', ['v1']);
  });

  it('does not call findQuestionOutcomesForVotes when there are no CLOSED votes', async () => {
    const openVote = {
      id: 'v2',
      title: 't2',
      status: 'OPEN',
      mode: 'PER_ROLLAM',
    } as unknown as VoteListItemResponseDto;
    voteReadRepository.findVotes.mockResolvedValue([openVote]);
    voteReadRepository.findVoterSummariesForVotes.mockResolvedValue(new Map());

    await handler.execute(
      new GetVotesQuery(
        'tenant-1',
        [TenantMembershipRole.ADMIN],
        'm1',
        undefined,
      ),
    );

    expect(
      voteReadRepository.findQuestionOutcomesForVotes,
    ).not.toHaveBeenCalled();
  });

  it('leaves questionOutcomes undefined for a CLOSED vote missing from the map', async () => {
    const closedVote = {
      id: 'v3',
      title: 't3',
      status: 'CLOSED',
      mode: 'PER_ROLLAM',
    } as unknown as VoteListItemResponseDto;
    voteReadRepository.findVotes.mockResolvedValue([closedVote]);
    voteReadRepository.findVoterSummariesForVotes.mockResolvedValue(new Map());
    voteReadRepository.findQuestionOutcomesForVotes.mockResolvedValue(
      new Map(),
    );

    const result = await handler.execute(
      new GetVotesQuery(
        'tenant-1',
        [TenantMembershipRole.ADMIN],
        'm1',
        undefined,
      ),
    );

    expect(result[0].questionOutcomes).toBeUndefined();
  });

  it('hides DRAFT votes from a unit owner by default', async () => {
    voteReadRepository.findVotes.mockResolvedValue([]);

    await handler.execute(
      new GetVotesQuery(
        'tenant-1',
        [TenantMembershipRole.UNIT_OWNER],
        'm1',
        undefined,
      ),
    );

    expect(voteReadRepository.findVotes).toHaveBeenCalledWith('tenant-1', [
      'SCHEDULED',
      'OPEN',
      'CLOSED',
      'CANCELLED',
    ]);
  });

  it('does not return DRAFT votes to a unit owner who asks for them', async () => {
    const result = await handler.execute(
      new GetVotesQuery('tenant-1', [TenantMembershipRole.UNIT_OWNER], 'm1', [
        'DRAFT',
      ]),
    );

    expect(result).toEqual([]);
    expect(voteReadRepository.findVotes).not.toHaveBeenCalled();
  });

  it('drops DRAFT from a unit owner status filter and keeps the rest', async () => {
    voteReadRepository.findVotes.mockResolvedValue([]);

    await handler.execute(
      new GetVotesQuery('tenant-1', [TenantMembershipRole.UNIT_OWNER], 'm1', [
        'DRAFT',
        'OPEN',
      ]),
    );

    expect(voteReadRepository.findVotes).toHaveBeenCalledWith('tenant-1', [
      'OPEN',
    ]);
  });

  it('passes a board member status filter through unchanged', async () => {
    voteReadRepository.findVotes.mockResolvedValue([]);

    await handler.execute(
      new GetVotesQuery('tenant-1', [TenantMembershipRole.BOARD_MEMBER], 'm1', [
        'DRAFT',
      ]),
    );

    expect(voteReadRepository.findVotes).toHaveBeenCalledWith('tenant-1', [
      'DRAFT',
    ]);
  });
});
