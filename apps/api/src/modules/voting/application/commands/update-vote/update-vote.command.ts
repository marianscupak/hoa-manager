import { UpdateVoteDto } from '@/modules/voting/api/dto/vote.dto';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';

export type UpdateVoteResult = VoteAggregate;

export class UpdateVoteCommand {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
    public readonly data: UpdateVoteDto,
  ) {}
}
