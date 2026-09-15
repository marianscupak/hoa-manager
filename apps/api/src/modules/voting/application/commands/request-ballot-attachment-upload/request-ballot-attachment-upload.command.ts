export class RequestBallotAttachmentUploadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
    public readonly data: {
      fileName: string;
      contentType: string;
      sizeBytes: number;
    },
  ) {}
}
