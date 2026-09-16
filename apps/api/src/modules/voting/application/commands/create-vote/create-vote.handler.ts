import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { AssemblyMeetingDateGuard } from '@/modules/voting/application/services/assembly-meeting-date.guard';
import { VoteCreatedAuditEvent } from '@/modules/voting/audit/events/vote-created.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

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
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
    private readonly meetingDateGuard: AssemblyMeetingDateGuard,
  ) {}

  async execute(command: CreateVoteCommand): Promise<CreateVoteResult> {
    await this.meetingDateGuard.assertWithinOwnershipRegister(
      command.tenantId,
      command.data.mode,
      command.data.scheduledFrom,
    );

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
