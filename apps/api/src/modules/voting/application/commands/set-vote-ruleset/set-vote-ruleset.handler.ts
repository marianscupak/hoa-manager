import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import {
  SetVoteRulesetCommand,
  SetVoteRulesetResult,
} from './set-vote-ruleset.command';
import { VOTE_WRITE_REPOSITORY } from '../../ports/vote-write.repository.port';
import type { VoteWriteRepository } from '../../ports/vote-write.repository.port';

@CommandHandler(SetVoteRulesetCommand)
export class SetVoteRulesetHandler implements ICommandHandler<SetVoteRulesetCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
  ) {}

  async execute(command: SetVoteRulesetCommand): Promise<SetVoteRulesetResult> {
    const { tenantId, voteId, data } = command;

    const aggregate = await this.voteWriteRepository.findById(tenantId, voteId);

    if (!aggregate) {
      throw new VoteNotFoundException();
    }

    aggregate.setRuleset(data);

    await this.voteWriteRepository.save(aggregate);

    return aggregate.ruleset!;
  }
}
