import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';

export type ScheduleVoteResult = VoteAggregate;

export class ScheduleVoteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {}
}
