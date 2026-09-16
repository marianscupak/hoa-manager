import { VoteAggregate } from '../../domain/vote/vote.aggregate';
import { ElectorateUnit } from '../../domain/vote/vote.types';

export interface ElectorateService {
  resolveElectorate(vote: VoteAggregate, now: Date): Promise<ElectorateUnit[]>;
  /**
   * The electorate for an assembly record: ownership as it stood on the day
   * of the meeting. One entry point shared by the roster, the attendance
   * command, the running count and the published snapshot — four callers each
   * picking their own instant is what let a record be entered against one
   * electorate and computed against another.
   */
  resolveAssemblyElectorate(
    vote: VoteAggregate,
    now: Date,
  ): Promise<ElectorateUnit[]>;
}

export const ELECTORATE_SERVICE = Symbol('ELECTORATE_SERVICE');
