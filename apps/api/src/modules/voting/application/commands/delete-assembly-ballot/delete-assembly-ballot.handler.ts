import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VoteMode, VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  NotAnAssemblyRecordException,
  VoteNotDraftException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

import { DeleteAssemblyBallotCommand } from './delete-assembly-ballot.command';

/**
 * Discards what the board entered for a unit, so it can be flipped back to
 * absent while a meeting is being written up.
 *
 * Scoped hard to an assembly record still in draft. A cast ballot is final
 * everywhere else, and this is the only command in the module that removes
 * one — it is also what keeps the edit freeze from being permanent, since the
 * freeze reads off whether any ballot exists.
 */
@CommandHandler(DeleteAssemblyBallotCommand)
export class DeleteAssemblyBallotHandler
  implements ICommandHandler<DeleteAssemblyBallotCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteRepository: VoteWriteRepository,
  ) {}

  async execute(command: DeleteAssemblyBallotCommand): Promise<void> {
    const { tenantId, voteId, unitId } = command;

    await this.uow.execute(async () => {
      const vote = await this.voteRepository.findById(tenantId, voteId);
      if (!vote) {
        throw new VoteNotFoundException();
      }
      if (vote.mode !== VoteMode.ASSEMBLY_RECORD) {
        throw new NotAnAssemblyRecordException();
      }
      if (vote.status !== VoteStatus.DRAFT) {
        throw new VoteNotDraftException();
      }

      await this.voteRepository.deleteBallotForUnit(tenantId, voteId, unitId);
    });
  }
}
