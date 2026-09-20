import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger as WinstonLogger } from 'winston';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteDocumentAddedAuditEvent } from '@/modules/voting/audit/events/vote-document-added.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteDocumentNotFoundException,
  VoteDocumentUploadIncompleteException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { ConfirmDocumentUploadCommand } from './confirm-document-upload.command';
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

@CommandHandler(ConfirmDocumentUploadCommand)
export class ConfirmDocumentUploadHandler
  implements ICommandHandler<ConfirmDocumentUploadCommand>
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
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  async execute(command: ConfirmDocumentUploadCommand): Promise<void> {
    const { tenantId, voteId, documentId } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);
    if (!aggregate) {
      throw new VoteNotFoundException();
    }
    if (aggregate.status !== VoteStatus.DRAFT) {
      throw new VoteNotDraftException();
    }

    const document = await this.documentRepository.findById(
      tenantId,
      voteId,
      documentId,
    );
    if (!document) {
      throw new VoteDocumentNotFoundException();
    }
    // Ballot scans have their own dedicated routes and must never be
    // reachable here. Until now that held only incidentally — ballot scans
    // exist only on OPEN votes and this handler requires DRAFT — so this
    // check makes the guarantee explicit rather than accidental.
    if (document.kind !== 'VOTE') {
      throw new VoteDocumentNotFoundException();
    }
    if (document.status === 'UPLOADED') {
      return; // idempotent — a retried confirm is not an error
    }

    const head = await this.storage.head(document.objectKey);
    if (!head || head.sizeBytes !== document.sizeBytes) {
      // Best-effort: the DB row is authoritative. An orphaned R2 object is
      // invisible to users and harmless; log and move on.
      if (head) {
        try {
          await this.storage.delete(document.objectKey);
        } catch (error: unknown) {
          this.logger.warn('R2ObjectDeleteFailed', {
            operation: 'confirm-document-upload',
            objectKey: document.objectKey,
            tenantId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      await this.documentRepository.deleteById(tenantId, documentId);
      throw new VoteDocumentUploadIncompleteException();
    }

    await this.unitOfWork.execute(async () => {
      await this.documentRepository.markUploaded(tenantId, documentId);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteDocumentAddedAuditEvent.build({
          voteId,
          tenantId,
          voteTitle: aggregate.title,
          documentId,
          fileName: document.fileName,
          sizeBytes: document.sizeBytes,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
