import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  VOTE_DOCUMENT_ALLOWED_CONTENT_TYPES,
  VOTE_DOCUMENT_MAX_COUNT,
  VOTE_DOCUMENT_MAX_SIZE_BYTES,
} from '@/modules/voting/domain/vote/vote-document.constants';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentLimitReachedException,
  VoteDocumentTooLargeException,
  VoteDocumentTypeNotAllowedException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { RequestDocumentUploadCommand } from './request-document-upload.command';
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

export interface RequestDocumentUploadResult {
  documentId: string;
  uploadUrl: string;
}

@CommandHandler(RequestDocumentUploadCommand)
export class RequestDocumentUploadHandler
  implements ICommandHandler<RequestDocumentUploadCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: RequestDocumentUploadCommand,
  ): Promise<RequestDocumentUploadResult> {
    const { tenantId, voteId, actorMembershipId, data } = command;

    if (!this.storage.isConfigured()) {
      throw new DocumentStorageNotConfiguredException();
    }

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);
    if (!aggregate) {
      throw new VoteNotFoundException();
    }
    if (aggregate.status !== VoteStatus.DRAFT) {
      throw new VoteNotDraftException();
    }

    if (!VOTE_DOCUMENT_ALLOWED_CONTENT_TYPES.includes(data.contentType)) {
      throw new VoteDocumentTypeNotAllowedException();
    }
    if (data.sizeBytes > VOTE_DOCUMENT_MAX_SIZE_BYTES) {
      throw new VoteDocumentTooLargeException();
    }

    const existingCount = await this.documentRepository.countByVoteId(
      tenantId,
      voteId,
    );
    if (existingCount >= VOTE_DOCUMENT_MAX_COUNT) {
      throw new VoteDocumentLimitReachedException();
    }

    const documentId = crypto.randomUUID();
    const objectKey = `tenants/${tenantId}/votes/${voteId}/${documentId}`;

    await this.unitOfWork.execute(async () => {
      await this.documentRepository.insert({
        id: documentId,
        tenantId,
        voteId,
        uploadedByMembershipId: actorMembershipId,
        fileName: data.fileName,
        contentType: data.contentType,
        sizeBytes: data.sizeBytes,
        objectKey,
        kind: 'VOTE',
        status: 'PENDING',
      });
    });

    const uploadUrl = await this.storage.presignPut(
      objectKey,
      data.contentType,
      data.sizeBytes,
    );

    return { documentId, uploadUrl };
  }
}
