import { CreateVoteQuestionDto } from '../../../api/dto/vote.dto';

export class CreateVoteQuestionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
    public readonly data: CreateVoteQuestionDto,
  ) {}
}
