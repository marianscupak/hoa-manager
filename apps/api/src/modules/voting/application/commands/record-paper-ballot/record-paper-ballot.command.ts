export class RecordPaperBallotCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
    public readonly unitId: string,
    public readonly signerOwnerId: string,
    public readonly attachmentDocumentId: string,
    public readonly answers: { questionId: string; optionId: string }[],
  ) {}
}
