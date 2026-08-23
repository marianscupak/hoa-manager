import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VoteCreatedAuditEvent } from '@/modules/voting/audit/events/vote-created.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import {
  CreateVoteCommand,
  type CreateVoteResult,
} from './create-vote.command';

@CommandHandler(CreateVoteCommand)
export class CreateVoteHandler implements ICommandHandler<CreateVoteCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly unitOfWork: DrizzleUnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: CreateVoteCommand): Promise<CreateVoteResult> {
    const vote = VoteAggregate.create(
      {
        title: command.data.title,
        description: command.data.description ?? null,
        mode: command.data.mode,
        scheduledFrom: command.data.scheduledFrom,
        scheduledTo: command.data.scheduledTo,
      },
      command.tenantId,
      command.createdByMembershipId,
      this.clock.now(),
    );

    await this.unitOfWork.execute(async () => {
      await this.voteRepository.save(vote);

      const actor = this.auditContext.requireActor();
      const createdByLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteCreatedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          title: vote.title,
          description: vote.description ?? null,
          actor,
          createdByLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });

    return vote;
  }
}
