import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

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
    });

    return aggregate.ruleset!;
  }
}

