import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentNotFoundException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

import { GetDocumentDownloadUrlQuery } from './get-document-download-url.query';
import {
  DOCUMENT_STORAGE,
  type DocumentStoragePort,
} from '../../ports/document-storage.port';
import {
  VOTE_DOCUMENT_REPOSITORY,
  type VoteDocumentRepository,
} from '../../ports/vote-document.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@QueryHandler(GetDocumentDownloadUrlQuery)
export class GetDocumentDownloadUrlHandler
  implements IQueryHandler<GetDocumentDownloadUrlQuery>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
  ) {}

  async execute(
    query: GetDocumentDownloadUrlQuery,
  ): Promise<{ downloadUrl: string }> {
    const { tenantId, voteId, documentId, roles } = query;

    if (!this.storage.isConfigured()) {
      throw new DocumentStorageNotConfiguredException();
    }

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);
    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    // Same DRAFT-visibility rule as GetVoteDetailHandler.
    const isPrivileged =
      roles.includes('ADMIN') || roles.includes('BOARD_MEMBER');
    if (aggregate.status === VoteStatus.DRAFT && !isPrivileged) {
      throw new VoteNotFoundException();
    }

    const document = await this.documentRepository.findById(
      tenantId,
      voteId,
      documentId,
    );
    if (!document || document.status !== 'UPLOADED') {
      throw new VoteDocumentNotFoundException();
    }

    const downloadUrl = await this.storage.presignGet(
      document.objectKey,
      document.fileName,
    );
    return { downloadUrl };
  }
}
