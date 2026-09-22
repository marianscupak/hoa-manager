import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import { type SubmitBallotResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { BallotCastProxyAuditEvent } from '@/modules/voting/audit/events/ballot-cast-proxy.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { assertAnswersMatchQuestions } from '@/modules/voting/domain/vote/ballot-answers';
import { isRecordableOnPaper } from '@/modules/voting/domain/vote/paper-ballot-eligibility';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';
import {
  BallotAlreadyCastException,
  NotAUnitOwnerException,
  UnitNotEligibleException,
  VoteDocumentNotFoundException,
  VoteDocumentUploadIncompleteException,
  VoteNotFoundException,
  VoteNotOpenException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  type UnitOfWork,
  UNIT_OF_WORK,
} from '@/shared/application/ports/unit-of-work.port';

import { RecordPaperBallotCommand } from './record-paper-ballot.command';
import {
  DOCUMENT_STORAGE,
  type DocumentStoragePort,
} from '../../ports/document-storage.port';
import {
  VOTE_DOCUMENT_REPOSITORY,
  type VoteDocumentRepository,
} from '../../ports/vote-document.repository.port';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../ports/vote-read.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '../../ports/vote-write.repository.port';

/**
 * A board member or admin transcribes a signed paper ballot for a unit that
 * has not voted yet. Unlike the owner booth, authorization is the controller's
 * role guard alone: the recorder never has to represent the unit.
 */
@CommandHandler(RecordPaperBallotCommand)
export class RecordPaperBallotHandler
  implements ICommandHandler<RecordPaperBallotCommand, SubmitBallotResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepository: VoteWriteRepository,
    @Inject(VOTE_DOCUMENT_REPOSITORY)
    private readonly documentRepository: VoteDocumentRepository,
    @Inject(DOCUMENT_STORAGE)
    private readonly storage: DocumentStoragePort,
    @Inject(UNIT_OF_WORK)
    private readonly uow: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(
    command: RecordPaperBallotCommand,
  ): Promise<SubmitBallotResponseDto> {
    const {
      tenantId,
      voteId,
      actorMembershipId,
      unitId,
      signerOwnerId,
      attachmentDocumentId,
      answers,
    } = command;

    return this.uow.execute(async () => {
      const occurredAt = this.clock.now();

      const vote = await this.voteReadRepository.findDetailById(
        tenantId,
        voteId,
      );
      if (!vote) throw new VoteNotFoundException();
      if (vote.status !== VoteStatus.OPEN) throw new VoteNotOpenException();

      // The electorate is frozen at open time. Per rollam a unit votes only
      // through its designated representative — who need not have an account;
      // a signed paper ballot is exactly how such an owner votes.
      const electorateUnit = await this.voteWriteRepository.findElectorateUnit(
        tenantId,
        voteId,
        unitId,
      );
      if (!electorateUnit || !isRecordableOnPaper(electorateUnit)) {
        throw new UnitNotEligibleException();
      }

      const existing = await this.voteWriteRepository.hasExistingBallots(
        tenantId,
        voteId,
        [unitId],
      );
      if (existing.size > 0) throw new BallotAlreadyCastException();

      // The signer is an owner of the unit, or the designated representative
      // even when they own no share of it (an outsider holding a power of
      // attorney).
      const signerOwnsUnit = await this.voteReadRepository.isActiveUnitOwner(
        tenantId,
        unitId,
        signerOwnerId,
        occurredAt,
      );
      if (
        !signerOwnsUnit &&
        signerOwnerId !== electorateUnit.representativeOwnerId
      ) {
        throw new NotAUnitOwnerException();
      }

      const attachment = await this.documentRepository.findById(
        tenantId,
        voteId,
        attachmentDocumentId,
      );
      if (!attachment || attachment.kind !== 'BALLOT') {
        throw new VoteDocumentNotFoundException();
      }
      if (
        await this.documentRepository.isAttachmentLinked(
          tenantId,
          attachmentDocumentId,
        )
      ) {
        throw new VoteDocumentNotFoundException();
      }

      const head = await this.storage.head(attachment.objectKey);
      if (!head || head.sizeBytes !== attachment.sizeBytes) {
        throw new VoteDocumentUploadIncompleteException();
      }

      assertAnswersMatchQuestions(vote.questions, answers);

      await this.documentRepository.markUploaded(
        tenantId,
        attachmentDocumentId,
      );

      const inserted = await this.voteWriteRepository.saveBallots(
        tenantId,
        voteId,
        [
          {
            unitId,
            castByMembershipId: actorMembershipId,
            castMethod: 'BOARD_PROXY' as const,
            attributionOwnerId: signerOwnerId,
            attachmentDocumentId,
            answers,
          },
        ],
      );
      const record = inserted[0];
      if (!record) {
        throw new Error(
          `Internal: saved ballot record for unit ${unitId} not found`,
        );
      }

      const actor = this.auditContext.requireActor();
      const [castByLabel, unitLabel, signerLabel] = await Promise.all([
        this.labelResolver.resolveActorLabel(actor),
        this.labelResolver.resolveUnitLabel(unitId),
        this.labelResolver.resolveOwnerLabel(signerOwnerId),
      ]);

      const labeledAnswers = answers.map((a) => {
        const question = vote.questions.find((q) => q.id === a.questionId);
        const option = question?.options.find((o) => o.id === a.optionId);
        if (!question || !option) {
          throw new Error(
            'Internal: ballot answer references missing question/option',
          );
        }
        return {
          questionText: question.title,
          optionText: option.label,
          optionKey: option.optionKey,
        };
      });

      await this.auditService.append(
        BallotCastProxyAuditEvent.build({
          voteId,
          tenantId,
          voteTitle: vote.title,
          ballotId: record.ballotId,
          unitId,
          unitLabel,
          signerOwnerId,
          signerLabel,
          attachmentFileName: attachment.fileName,
          actor,
          castByLabel,
          answers,
          labeledAnswers,
          occurredAt,
        }),
      );

      return { submittedAt: occurredAt };
    });
  }
}
