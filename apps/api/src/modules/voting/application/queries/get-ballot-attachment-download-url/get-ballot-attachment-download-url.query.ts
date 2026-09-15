export class GetBallotAttachmentDownloadUrlQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly documentId: string,
  ) {}
}
