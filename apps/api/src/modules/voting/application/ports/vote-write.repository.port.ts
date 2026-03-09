import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';

export interface VoteWriteRepository {
  save(vote: VoteAggregate): Promise<void>;
}

export const VOTE_WRITE_REPOSITORY = Symbol('VOTE_WRITE_REPOSITORY');
