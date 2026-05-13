import { Inject } from '@nestjs/common';
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
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@CommandHandler(DeleteVoteCommand)
export class DeleteVoteHandler implements ICommandHandler<DeleteVoteCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
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
  }
}
