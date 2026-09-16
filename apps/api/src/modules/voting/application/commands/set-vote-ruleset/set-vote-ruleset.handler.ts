import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { VoteRulesetNonStatutoryAcknowledgedAuditEvent } from '@/modules/voting/audit/events/vote-ruleset-non-statutory-acknowledged.event';
import { VoteRulesetSetAuditEvent } from '@/modules/voting/audit/events/vote-ruleset-set.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import {
  materializeRuleset,
  validateRuleset,
} from '@/modules/voting/domain/vote/ruleset-validation';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

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
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
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

    const ruleset = materializeRuleset({ ...data, quorum: data.quorum });
    aggregate.setRuleset(ruleset);

    await this.unitOfWork.execute(async () => {
      await this.voteWriteRepository.save(aggregate);

      const actor = this.auditContext.requireActor();
      const setByLabel = await this.labelResolver.resolveActorLabel(actor);
      const occurredAt = this.clock.now();

      await this.auditService.append(
        VoteRulesetSetAuditEvent.build({
          voteId: aggregate.id,
          tenantId: aggregate.tenantId,
          voteTitle: aggregate.title,
          ruleset,
          actor,
          setByLabel,
          occurredAt,
        }),
      );

      const { tier3 } = validateRuleset(aggregate.mode, ruleset);
      if (tier3.length > 0) {
        await this.auditService.append(
          VoteRulesetNonStatutoryAcknowledgedAuditEvent.build({
            voteId: aggregate.id,
            tenantId: aggregate.tenantId,
            voteTitle: aggregate.title,
            deviations: tier3,
            actor,
            acknowledgedByLabel: setByLabel,
            occurredAt,
          }),
        );
      }
    });

    return aggregate.ruleset!;
  }
}
