import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteDocumentRemovedAuditEvent } from '@/modules/voting/audit/events/vote-document-removed.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteDocumentNotFoundException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { DeleteVoteDocumentCommand } from './delete-vote-document.command';
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

@CommandHandler(DeleteVoteDocumentCommand)
export class DeleteVoteDocumentHandler
  implements ICommandHandler<DeleteVoteDocumentCommand>
{
  private readonly logger = new Logger(DeleteVoteDocumentHandler.name);

  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: DeleteVoteDocumentCommand): Promise<void> {
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

    await this.unitOfWork.execute(async () => {
      await this.documentRepository.deleteById(tenantId, documentId);

      const actor = this.auditContext.requireActor();
      const actorLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteDocumentRemovedAuditEvent.build({
          voteId,
          tenantId,
          voteTitle: aggregate.title,
          documentId,
          fileName: document.fileName,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });

    // Best-effort: the DB row is authoritative. An orphaned R2 object is
    // invisible to users and harmless; log and move on.
    try {
      await this.storage.delete(document.objectKey);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to delete R2 object ${document.objectKey}: ${message}`,
      );
    }
  }
}
