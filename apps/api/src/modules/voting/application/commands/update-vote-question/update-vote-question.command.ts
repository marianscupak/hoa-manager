import { UpdateVoteQuestionDto } from '../../../api/dto/vote.dto';

export class UpdateVoteQuestionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly questionId: string,
    public readonly data: UpdateVoteQuestionDto,
  ) {}
}
