export class ConfirmDocumentUploadCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly documentId: string,
  ) {}
}
