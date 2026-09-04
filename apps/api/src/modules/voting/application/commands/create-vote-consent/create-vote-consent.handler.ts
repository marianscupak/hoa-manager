import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  VOTE_CONSENT_WRITE_REPOSITORY,
  type VoteConsentWriteRepository,
} from '@/modules/voting/application/ports/vote-consent-write.repository.port';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import {
  VOTE_WRITE_REPOSITORY,
  type VoteWriteRepository,
} from '@/modules/voting/application/ports/vote-write.repository.port';
import { VoteConsentCreatedAuditEvent } from '@/modules/voting/audit/events/vote-consent-created.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import {
  VoteStatus,
  VoteUnitConsentStatus,
} from '@/modules/voting/domain/vote/vote.types';
import { ForbiddenException } from '@/shared/application/exceptions/auth.exceptions';
import {
  InvalidVoteStatusForDelegationException,
  MembershipHasNoAssociatedOwnerException,
  NotAUnitOwnerException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';

import { CreateVoteConsentCommand } from './create-vote-consent.command';

@CommandHandler(CreateVoteConsentCommand)
export class CreateVoteConsentHandler
  implements ICommandHandler<CreateVoteConsentCommand>
{
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepo: VoteWriteRepository,
    @Inject(VOTE_CONSENT_WRITE_REPOSITORY)
    private readonly consentWriteRepo: VoteConsentWriteRepository,
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
    private readonly unitOfWork: DrizzleUnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
  ) {}

  async execute(command: CreateVoteConsentCommand): Promise<void> {
    const vote = await this.voteWriteRepo.findById(
      command.tenantId,
      command.voteId,
    );

    if (!vote) {
      throw new VoteNotFoundException();
    }

    if (vote.status !== VoteStatus.SCHEDULED) {
      throw new InvalidVoteStatusForDelegationException();
    }

    let ownerId: string;
    // Only the self-service path has a caller membership behind the
    // grantor — an admin-supplied fromOwnerId may belong to an
    // account-less owner (e.g. an SJM spouse), so there is nothing to
    // point the audit trail's "owner membership" at in that case.
    let ownerMembershipIdForAudit: string | null;

    if (command.fromOwnerId) {
      const isAdminOrBoard =
        command.roles.includes('ADMIN') ||
        command.roles.includes('BOARD_MEMBER');

      if (!isAdminOrBoard) {
        throw new ForbiddenException();
      }

      const isOwner = await this.voteReadRepo.isActiveUnitOwner(
        command.tenantId,
        command.unitId,
        command.fromOwnerId,
        this.clock.now(),
      );
      if (!isOwner) {
        throw new NotAUnitOwnerException();
      }

      ownerId = command.fromOwnerId;
      ownerMembershipIdForAudit = null;
    } else {
      const statuses = await this.voteReadRepo.findVoterStatus(
        command.tenantId,
        command.voteId,
        command.membershipId,
        this.clock.now(),
      );

      const isOwner = statuses.owningUnits.some((u) => u.id === command.unitId);
      if (!isOwner) {
        throw new NotAUnitOwnerException();
      }

      const resolvedOwnerId = await this.voteReadRepo.getOwnerIdByMembership(
        command.tenantId,
        command.membershipId,
      );

      if (!resolvedOwnerId) {
        throw new MembershipHasNoAssociatedOwnerException();
      }

      ownerId = resolvedOwnerId;
      ownerMembershipIdForAudit = command.membershipId;
    }

    await this.unitOfWork.execute(async () => {
      const consentId = await this.consentWriteRepo.save({
        tenantId: command.tenantId,
        voteId: command.voteId,
        unitId: command.unitId,
        fromOwnerId: ownerId,
        toMembershipId: command.delegateMembershipId,
        recordedByMembershipId: command.membershipId,
        status: VoteUnitConsentStatus.VALID,
      });

      const actor = this.auditContext.requireActor();
      const [actorLabel, unitLabel, ownerLabel, delegateLabel] =
        await Promise.all([
          this.labelResolver.resolveActorLabel(actor),
          this.labelResolver.resolveUnitLabel(command.unitId),
          this.labelResolver.resolveOwnerLabel(ownerId),
          this.labelResolver.resolveMembershipLabel(
            command.delegateMembershipId,
          ),
        ]);

      await this.auditService.append(
        VoteConsentCreatedAuditEvent.build({
          voteId: vote.id,
          tenantId: vote.tenantId,
          voteTitle: vote.title,
          consentId,
          unitId: command.unitId,
          unitLabel,
          ownerMembershipId: ownerMembershipIdForAudit,
          ownerLabel,
          delegateMembershipId: command.delegateMembershipId,
          delegateLabel,
          recordedByMembershipId: command.membershipId,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
