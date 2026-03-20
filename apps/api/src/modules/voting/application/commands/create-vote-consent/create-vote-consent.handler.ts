import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
import {
  VoteStatus,
  VoteUnitConsentStatus,
} from '@/modules/voting/domain/vote/vote.types';
import { ForbiddenException } from '@/shared/application/exceptions/auth.exceptions';
import {
  InvalidVoteStatusForDelegationException,
  MembershipHasNoAssociatedOwnerException,
  MutualDelegationNotAllowedException,
  NotAUnitOwnerException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

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

    let effectiveMembershipId = command.membershipId;

    if (command.ownerMembershipId) {
      const isAdminOrBoard =
        command.roles.includes('ADMIN') ||
        command.roles.includes('BOARD_MEMBER');

      if (!isAdminOrBoard) {
        throw new ForbiddenException();
      }
      effectiveMembershipId = command.ownerMembershipId;
    }

    // Verify the user is an owner of the unit
    const statuses = await this.voteReadRepo.findVoterStatus(
      command.tenantId,
      command.voteId,
      effectiveMembershipId,
    );

    const isOwner = statuses.owningUnits.some((u) => u.id === command.unitId);
    if (!isOwner) {
      throw new NotAUnitOwnerException();
    }

    // Resolve exactly which owner this membership maps to for this unit.
    const ownerId = await this.voteReadRepo.getOwnerIdByMembership(
      command.tenantId,
      effectiveMembershipId,
    );

    if (!ownerId) {
      throw new MembershipHasNoAssociatedOwnerException();
    }

    // Prevent mutual delegation: Check if the delegate has already delegated to THIS owner
    const hasMutual = await this.voteReadRepo.hasMutualDelegation(
      command.tenantId,
      command.unitId,
      command.voteId,
      effectiveMembershipId,
      command.delegateMembershipId,
    );

    if (hasMutual) {
      throw new MutualDelegationNotAllowedException();
    }

    await this.consentWriteRepo.save({
      tenantId: command.tenantId,
      voteId: command.voteId,
      unitId: command.unitId,
      fromOwnerId: ownerId,
      toMembershipId: command.delegateMembershipId,
      recordedByMembershipId: command.membershipId,
      status: VoteUnitConsentStatus.VALID,
    });
  }
}
