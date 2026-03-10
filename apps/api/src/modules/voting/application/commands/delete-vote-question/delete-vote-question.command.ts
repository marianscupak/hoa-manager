export class DeleteVoteQuestionCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly questionId: string,
  ) {}
}
