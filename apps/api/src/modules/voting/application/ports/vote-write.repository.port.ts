import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { ElectorateUnit } from '@/modules/voting/domain/vote/vote.types';

export interface VoteWriteRepository {
  findById(tenantId: string, id: string): Promise<VoteAggregate | null>;
  save(vote: VoteAggregate): Promise<void>;
  saveElectorateUnits(
    tenantId: string,
    voteId: string,
    units: ElectorateUnit[],
  ): Promise<void>;
  findScheduledToOpen(now: Date): Promise<VoteAggregate[]>;
}

export const VOTE_WRITE_REPOSITORY = Symbol('VOTE_WRITE_REPOSITORY');
