import { type CreateVoteDto } from '@/modules/voting/api/dto/vote.dto';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';

export class CreateVoteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly createdByMembershipId: string,
    public readonly data: CreateVoteDto,
  ) {}
}

export type CreateVoteResult = {
  id: string;
  title: string;
  description: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  status: VoteStatus;
};
