import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { and, eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { owners } from '@/infrastructure/db/schema/core/owners';
import { tenantMemberships } from '@/infrastructure/db/schema/core/tenant-memberships';
import { voteUnitConsents } from '@/infrastructure/db/schema/voting/vote-unit-consents';
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
import {
  InvalidVoteStatusForDelegationException,
  MembershipHasNoAssociatedOwnerException,
  MutualDelegationNotAllowedException,
  NotAUnitOwnerException,
  VoteNotFoundException,
} from '@/shared/application/exceptions/vote.exceptions';

import { CreateVoteConsentCommand } from './create-vote-consent.command';

@CommandHandler(CreateVoteConsentCommand)
export class CreateVoteConsentHandler implements ICommandHandler<CreateVoteConsentCommand> {
  constructor(
    @Inject(VOTE_WRITE_REPOSITORY)
    private readonly voteWriteRepo: VoteWriteRepository,
    @Inject(VOTE_CONSENT_WRITE_REPOSITORY)
    private readonly consentWriteRepo: VoteConsentWriteRepository,
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
    private readonly drizzle: DrizzleService,
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

    // Verify the user is an owner of the unit
    const statuses = await this.voteReadRepo.findVoterStatus(
      command.tenantId,
      command.voteId,
      command.membershipId,
    );

    const isOwner = statuses.owningUnits.some((u) => u.id === command.unitId);
    if (!isOwner) {
      throw new NotAUnitOwnerException();
    }

    // Resolve exactly which owner this membership maps to for this unit.
    const results = await this.drizzle.db
      .select({ ownerId: owners.id })
      .from(tenantMemberships)
      .innerJoin(owners, eq(owners.userId, tenantMemberships.userId))
      .where(and(eq(tenantMemberships.id, command.membershipId)))
      .limit(1);

    if (results.length === 0) {
      throw new MembershipHasNoAssociatedOwnerException();
    }
    const ownerId = results[0].ownerId;

    // Prevent mutual delegation: Check if the delegate has already delegated to THIS owner
    const mutualConsent = await this.drizzle.db
      .select({ id: voteUnitConsents.id })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.unitId, command.unitId),
          eq(voteUnitConsents.voteId, command.voteId),
          eq(voteUnitConsents.toMembershipId, command.membershipId),
          // We need to resolve the delegateMembershipId's ownerId,
          // but actually we can just check if they have a consent where TO is us.
          eq(
            voteUnitConsents.fromOwnerId,
            this.drizzle.db
              .select({ id: owners.id })
              .from(tenantMemberships)
              .innerJoin(owners, eq(owners.userId, tenantMemberships.userId))
              .where(eq(tenantMemberships.id, command.delegateMembershipId)),
          ),
        ),
      )
      .limit(1);

    if (mutualConsent.length > 0) {
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
