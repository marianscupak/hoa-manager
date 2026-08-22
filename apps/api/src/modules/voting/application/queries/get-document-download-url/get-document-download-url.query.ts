export class GetDocumentDownloadUrlQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly documentId: string,
    public readonly roles: string[],
  ) {}
}
