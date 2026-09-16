import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  BALLOT_SCAN_ALLOWED_CONTENT_TYPES,
  BALLOT_SCAN_MAX_SIZE_BYTES,
} from '@/modules/voting/domain/vote/vote-document.constants';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  DocumentStorageNotConfiguredException,
  VoteDocumentTooLargeException,
  VoteDocumentTypeNotAllowedException,
  VoteNotFoundException,
  VoteNotOpenException,
} from '@/shared/application/exceptions/vote.exceptions';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { RequestBallotAttachmentUploadCommand } from './request-ballot-attachment-upload.command';
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

export interface RequestBallotAttachmentUploadResult {
  documentId: string;
  uploadUrl: string;
}

@CommandHandler(RequestBallotAttachmentUploadCommand)
export class RequestBallotAttachmentUploadHandler
  implements ICommandHandler<RequestBallotAttachmentUploadCommand>
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
    command: RequestBallotAttachmentUploadCommand,
  ): Promise<RequestBallotAttachmentUploadResult> {
    const { tenantId, voteId, actorMembershipId, data } = command;

    if (!this.storage.isConfigured()) {
      throw new DocumentStorageNotConfiguredException();
    }

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);
    if (!aggregate) {
      throw new VoteNotFoundException();
    }
    if (aggregate.status !== VoteStatus.OPEN) {
      throw new VoteNotOpenException();
    }

    if (!BALLOT_SCAN_ALLOWED_CONTENT_TYPES.includes(data.contentType)) {
      throw new VoteDocumentTypeNotAllowedException();
    }
    if (data.sizeBytes > BALLOT_SCAN_MAX_SIZE_BYTES) {
      throw new VoteDocumentTooLargeException();
    }

    const documentId = crypto.randomUUID();
    const objectKey = `tenants/${tenantId}/votes/${voteId}/ballots/${documentId}`;

    // Stays PENDING on purpose. RecordPaperBallotHandler verifies the object
    // and flips it to UPLOADED inside the transaction that writes the ballot,
    // so an abandoned flow leaves a row the stale-upload cron reaps and no
    // audit line for a ballot that was never recorded.
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
        kind: 'BALLOT',
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
