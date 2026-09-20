import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { VoteDocumentNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { DeleteBallotAttachmentCommand } from './delete-ballot-attachment.command';
import {
  DOCUMENT_STORAGE,
  type DocumentStoragePort,
} from '../../ports/document-storage.port';
import {
  VOTE_DOCUMENT_REPOSITORY,
  type VoteDocumentRepository,
} from '../../ports/vote-document.repository.port';

@CommandHandler(DeleteBallotAttachmentCommand)
export class DeleteBallotAttachmentHandler
  implements ICommandHandler<DeleteBallotAttachmentCommand>
{
  constructor(
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async execute(command: DeleteBallotAttachmentCommand): Promise<void> {
    const { tenantId, voteId, documentId } = command;

    const document = await this.documentRepository.findById(
      tenantId,
      voteId,
      documentId,
    );
    if (!document || document.kind !== 'BALLOT') {
      throw new VoteDocumentNotFoundException();
    }

    // A linked attachment can neither be deleted nor reused for another
    // ballot; treat it the same as "not found" rather than leaking that
    // distinction. This is a friendly pre-check for a clean domain error —
    // the real guarantee is the DB's ON DELETE RESTRICT on
    // ballots.attachment_document_id, which refuses the delete outright if a
    // ballot gets recorded against this document between this check and the
    // deleteById call below (a check-then-act race a transaction here would
    // not close under READ COMMITTED).
    const linked = await this.documentRepository.isAttachmentLinked(
      tenantId,
      documentId,
    );
    if (linked) {
      throw new VoteDocumentNotFoundException();
    }

    // No audit event: nothing was recorded yet, so there is nothing to
    // account for beyond the DB row itself.
    await this.documentRepository.deleteById(tenantId, documentId);

    // Best-effort: the DB row is authoritative. An orphaned R2 object is
    // invisible to users and harmless; log and move on.
    try {
      await this.storage.delete(document.objectKey);
    } catch (error: unknown) {
      this.logger.warn('R2ObjectDeleteFailed', {
        operation: 'delete-ballot-attachment',
        objectKey: document.objectKey,
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
