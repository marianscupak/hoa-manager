import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  DocumentStorageNotConfiguredException,
  VoteDocumentNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

import { GetBallotAttachmentDownloadUrlQuery } from './get-ballot-attachment-download-url.query';
import {
  DOCUMENT_STORAGE,
  type DocumentStoragePort,
} from '../../ports/document-storage.port';
import {
  VOTE_DOCUMENT_REPOSITORY,
  type VoteDocumentRepository,
} from '../../ports/vote-document.repository.port';

@QueryHandler(GetBallotAttachmentDownloadUrlQuery)
export class GetBallotAttachmentDownloadUrlHandler
  implements IQueryHandler<GetBallotAttachmentDownloadUrlQuery>
{
  constructor(
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
  ) {}

  async execute(
    query: GetBallotAttachmentDownloadUrlQuery,
  ): Promise<{ downloadUrl: string }> {
    const { tenantId, voteId, documentId } = query;

    if (!this.storage.isConfigured()) {
      throw new DocumentStorageNotConfiguredException();
    }

    const document = await this.documentRepository.findById(
      tenantId,
      voteId,
      documentId,
    );
    // A scan is only downloadable once its ballot was actually recorded.
    if (
      !document ||
      document.kind !== 'BALLOT' ||
      document.status !== 'UPLOADED'
    ) {
      throw new VoteDocumentNotFoundException();
    }

    const downloadUrl = await this.storage.presignGet(
      document.objectKey,
      document.fileName,
    );
    return { downloadUrl };
  }
}
