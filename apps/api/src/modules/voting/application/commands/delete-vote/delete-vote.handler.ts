import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteDeletedAuditEvent } from '@/modules/voting/audit/events/vote-deleted.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { DeleteVoteCommand } from './delete-vote.command';
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

@CommandHandler(DeleteVoteCommand)
export class DeleteVoteHandler implements ICommandHandler<DeleteVoteCommand> {
  private readonly logger = new Logger(DeleteVoteHandler.name);

  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
  ) {}

  async execute(command: DeleteVoteCommand): Promise<void> {
    const { tenantId, voteId } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    if (aggregate.status !== VoteStatus.DRAFT) {
      throw new VoteNotDraftException();
    }

    const voteTitle = aggregate.title;

    const documents = await this.documentRepository.findByVoteId(
      tenantId,
      voteId,
    );

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.delete(tenantId, voteId);

      const actor = this.auditContext.requireActor();
      const deletedByLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteDeletedAuditEvent.build({
          voteId,
          tenantId,
          voteTitle,
          actor,
          deletedByLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });

    if (this.storage.isConfigured()) {
      for (const document of documents) {
        try {
          await this.storage.delete(document.objectKey);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Failed to delete R2 object ${document.objectKey}: ${message}`,
          );
        }
      }
    }
  }
}
