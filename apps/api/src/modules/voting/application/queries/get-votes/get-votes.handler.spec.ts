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
    handler = new GetVotesHandler(voteReadRepository);
  });

  it('attaches questionOutcomes from the map to a CLOSED vote', async () => {
    const closedVote = {
      id: 'v1',
      title: 't',
      status: 'CLOSED',
      allowCoOwnerIndividualVote: false,
    } as unknown as VoteListItemResponseDto;
    voteReadRepository.findVotes.mockResolvedValue([closedVote]);
    voteReadRepository.findVoterSummariesForVotes.mockResolvedValue(
      new Map(),
    );
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
    expect(voteReadRepository.findQuestionOutcomesForVotes).toHaveBeenCalledWith(
      'tenant-1',
      ['v1'],
    );
  });

  it('does not call findQuestionOutcomesForVotes when there are no CLOSED votes', async () => {
    const openVote = {
      id: 'v2',
      title: 't2',
      status: 'OPEN',
      allowCoOwnerIndividualVote: false,
    } as unknown as VoteListItemResponseDto;
    voteReadRepository.findVotes.mockResolvedValue([openVote]);
    voteReadRepository.findVoterSummariesForVotes.mockResolvedValue(
      new Map(),
    );

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
      allowCoOwnerIndividualVote: false,
    } as unknown as VoteListItemResponseDto;
    voteReadRepository.findVotes.mockResolvedValue([closedVote]);
    voteReadRepository.findVoterSummariesForVotes.mockResolvedValue(
      new Map(),
    );
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
});
