import { VoteAggregate } from '../../domain/vote/vote.aggregate';
import { ElectorateUnit } from '../../domain/vote/vote.types';

export interface ElectorateService {
  resolveElectorate(vote: VoteAggregate): Promise<ElectorateUnit[]>;
}

export const ELECTORATE_SERVICE = Symbol('ELECTORATE_SERVICE');
