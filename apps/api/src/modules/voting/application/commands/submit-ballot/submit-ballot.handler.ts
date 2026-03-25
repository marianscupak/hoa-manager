import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { type SubmitBallotResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteNotFoundException,
  VoteNotOpenException,
  BallotAlreadyCastException,
  InvalidBallotAnswersException,
  NotUnitRepresentativeException,
} from '@/shared/application/exceptions/vote.exceptions';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';

import { SubmitBallotCommand } from './submit-ballot.command';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

@CommandHandler(SubmitBallotCommand)
export class SubmitBallotHandler
  implements ICommandHandler<SubmitBallotCommand, SubmitBallotResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: SubmitBallotCommand,
  ): Promise<SubmitBallotResponseDto> {
    const { tenantId, voteId, membershipId, ballots: ballotInputs } = command;

    return this.uow.execute(async () => {
      // 1. Load vote detail and verify it's OPEN
      const vote = await this.voteReadRepository.findDetailById(
        tenantId,
        voteId,
      );
      if (!vote) {
        throw new VoteNotFoundException();
      }
      if (vote.status !== VoteStatus.OPEN) {
        throw new VoteNotOpenException();
      }

      const unitIds = ballotInputs.map((b) => b.unitId);

      // 2. Verify all units are in the electorate with this membership as representative
      const electorateUnits =
        await this.voteWriteRepository.findElectorateUnitsForMembership(
          tenantId,
          voteId,
          membershipId,
          unitIds,
        );

      const eligibleUnitIds = new Set(electorateUnits.map((e) => e.unitId));
      for (const unitId of unitIds) {
        if (!eligibleUnitIds.has(unitId)) {
          throw new NotUnitRepresentativeException();
        }
      }

      // 3. Check for existing ballots (accounts for allowCoOwnerIndividualVote)
      const allowCoOwnerIndividualVote =
        vote.ruleset?.allowCoOwnerIndividualVote ?? false;

      const existingBallotUnitIds =
        await this.voteWriteRepository.hasExistingBallots(
          tenantId,
          voteId,
          unitIds,
          allowCoOwnerIndividualVote ? membershipId : undefined,
        );

      if (existingBallotUnitIds.size > 0) {
        throw new BallotAlreadyCastException();
      }

      // 4. Validate answers match vote questions and options
      const questionMap = new Map(
        vote.questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]),
      );

      for (const ballot of ballotInputs) {
        // Each ballot must answer every question exactly once
        const answeredQuestionIds = new Set(
          ballot.answers.map((a) => a.questionId),
        );

        if (answeredQuestionIds.size !== vote.questions.length) {
          throw new InvalidBallotAnswersException();
        }

        for (const answer of ballot.answers) {
          const validOptionIds = questionMap.get(answer.questionId);
          if (!validOptionIds || !validOptionIds.has(answer.optionId)) {
            throw new InvalidBallotAnswersException();
          }
        }
      }

      // 5. Persist all ballots atomically
      const now = new Date();
      await this.voteWriteRepository.saveBallots(
        tenantId,
        voteId,
        ballotInputs.map((b) => ({
          unitId: b.unitId,
          castByMembershipId: membershipId,
          castMethod: 'DIRECT' as const,
          answers: b.answers,
        })),
      );

      return { submittedAt: now };
    });
  }
}
