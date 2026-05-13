import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteRulesetSetAuditEvent } from '@/modules/voting/audit/events/vote-ruleset-set.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import {
  SetVoteRulesetCommand,
  SetVoteRulesetResult,
} from './set-vote-ruleset.command';
import { VOTE_WRITE_REPOSITORY } from '../../ports/vote-write.repository.port';
import type { VoteWriteRepository } from '../../ports/vote-write.repository.port';

@CommandHandler(SetVoteRulesetCommand)
export class SetVoteRulesetHandler
  implements ICommandHandler<SetVoteRulesetCommand>
{
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

  async execute(command: SetVoteRulesetCommand): Promise<SetVoteRulesetResult> {
    const { tenantId, voteId, data } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    aggregate.setRuleset(data);

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.save(aggregate);

      const actor = this.auditContext.requireActor();
      const setByLabel = await this.labelResolver.resolveActorLabel(actor);

      await this.auditService.append(
        VoteRulesetSetAuditEvent.build({
          voteId: aggregate.id,
          tenantId: aggregate.tenantId,
          voteTitle: aggregate.title,
          ruleset: aggregate.ruleset!,
          actor,
          setByLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });

    return aggregate.ruleset!;
  }
}
