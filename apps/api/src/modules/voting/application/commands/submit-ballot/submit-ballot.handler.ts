import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { type SubmitBallotResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { BallotCastDirectAuditEvent } from '@/modules/voting/audit/events/ballot-cast-direct.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  VoteNotFoundException,
  VoteNotOpenException,
  BallotAlreadyCastException,
  InvalidBallotAnswersException,
  NotUnitRepresentativeException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
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
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
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
      const occurredAt = this.clock.now();
      const inserted = await this.voteWriteRepository.saveBallots(
        tenantId,
        voteId,
        ballotInputs.map((b) => ({
          unitId: b.unitId,
          castByMembershipId: membershipId,
          castMethod: 'DIRECT' as const,
          answers: b.answers,
        })),
      );

      // 6. Emit audit event per ballot
      const actor = this.auditContext.requireActor();
      const castByLabel = await this.labelResolver.resolveActorLabel(actor);

      for (const ballot of ballotInputs) {
        const record = inserted.find((r) => r.unitId === ballot.unitId);
        if (!record) {
          throw new Error(
            `Internal: saved ballot record for unit ${ballot.unitId} not found`,
          );
        }

        const unitLabel = await this.labelResolver.resolveUnitLabel(
          ballot.unitId,
        );

        const labeledAnswers = ballot.answers.map((a) => {
          const question = vote.questions.find((q) => q.id === a.questionId);
          const option = question?.options.find((o) => o.id === a.optionId);
          if (!question || !option) {
            throw new Error(
              'Internal: ballot answer references missing question/option',
            );
          }
          return { questionText: question.title, optionText: option.label };
        });

        await this.auditService.append(
          BallotCastDirectAuditEvent.build({
            voteId,
            tenantId,
            voteTitle: vote.title,
            ballotId: record.ballotId,
            unitId: ballot.unitId,
            unitLabel,
            actor,
            castByLabel,
            answers: ballot.answers,
            labeledAnswers,
            occurredAt,
          }),
        );
      }

      return { submittedAt: occurredAt };
    });
  }
}
