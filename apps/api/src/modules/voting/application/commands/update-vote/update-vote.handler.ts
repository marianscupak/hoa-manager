import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VoteUpdatedAuditEvent } from '@/modules/voting/audit/events/vote-updated.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { DomainException } from '@/shared/errors/domain.exception';
import { ErrorCode } from '@/shared/errors/error-codes';

import {
  UpdateVoteCommand,
  type UpdateVoteResult,
} from './update-vote.command';

@CommandHandler(UpdateVoteCommand)
export class UpdateVoteHandler implements ICommandHandler<UpdateVoteCommand> {
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
  ) {}

  async execute(command: UpdateVoteCommand): Promise<UpdateVoteResult> {
    const vote = await this.voteRepository.findById(
      command.tenantId,
      command.id,
    );

    if (!vote) {
      throw new DomainException(ErrorCode.VOTE_NOT_FOUND);
    }

    // `mode` is immutable after create — it decides which statutory ruleset
    // is legal, so switching it would invalidate the stored one.
    if (command.data.mode && command.data.mode !== vote.mode) {
      throw new DomainException(ErrorCode.RULESET_CHANGE_BLOCKED);
    }

    vote.update({ ...command.data, mode: vote.mode }, this.clock.now());

    await this.unitOfWork.execute(async () => {
      await this.voteRepository.save(vote);

      const actor = this.auditContext.requireActor();
      const updatedByLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteUpdatedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          voteTitle: vote.title,
          actor,
          updatedByLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });

    return vote;
  }
}
