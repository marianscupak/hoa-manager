import { VoteResultSnapshot } from '@/modules/voting/domain/vote/vote-result.types';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';

export interface ResultCalculationService {
  calculate(
    tenantId: string,
    voteId: string,
    vote: VoteAggregate,
  ): Promise<VoteResultSnapshot>;
}

export const RESULT_CALCULATION_SERVICE = Symbol('RESULT_CALCULATION_SERVICE');
