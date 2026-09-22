import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ConsentPreviewResponseDto } from '@/modules/voting/api/dto/vote.dto';
import { toRepresentativeRef } from '@/modules/voting/application/commands/create-vote-consent/consent-target-input';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import {
  applyHypotheticalConsent,
  resolveElectorateUnits,
} from '@/modules/voting/domain/vote/electorate-resolution';
import { ElectorateIneligibleReason } from '@/modules/voting/domain/vote/vote.types';
import {
  MembershipHasNoAssociatedOwnerException,
  NotAUnitOwnerException,
} from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

import { PreviewConsentOutcomeQuery } from './preview-consent-outcome.query';

/**
 * Answers "what happens to this unit if I record this consent?" before one is
 * saved, so the delegation flow can warn about the case that surprises people:
 * a consent can take a unit's representative away instead of moving it. A
 * spouse designated by the other spouse holds an SJM unit only while they back
 * themselves — consenting to anyone else drops that support, and the unit is
 * left with nobody until the other spouse names the same person too.
 *
 * The grantor is the caller's own owner record, checked exactly as
 * `CreateVoteConsentHandler` checks it: previewing an outcome must not tell a
 * non-owner anything the real command would refuse them.
 */
@QueryHandler(PreviewConsentOutcomeQuery)
export class PreviewConsentOutcomeHandler
  implements
    IQueryHandler<PreviewConsentOutcomeQuery, ConsentPreviewResponseDto>
{
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepository: VoteReadRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    query: PreviewConsentOutcomeQuery,
  ): Promise<ConsentPreviewResponseDto> {
    const now = this.clock.now();
    const to = toRepresentativeRef(query.target);

    const ownerId = await this.voteReadRepository.getOwnerIdByMembership(
      query.tenantId,
      query.membershipId,
    );
    if (!ownerId) {
      throw new MembershipHasNoAssociatedOwnerException();
    }

    const isOwner = await this.voteReadRepository.isActiveUnitOwner(
      query.tenantId,
      query.unitId,
      ownerId,
      now,
    );
    if (!isOwner) {
      throw new NotAUnitOwnerException();
    }

    const inputs = await this.voteReadRepository.loadElectorateInputs(
      query.tenantId,
      query.voteId,
      [query.unitId],
      now,
    );

    const [resolved] = resolveElectorateUnits(
      inputs.units,
      inputs.parties,
      applyHypotheticalConsent(inputs.consents, {
        unitId: query.unitId,
        fromOwnerId: ownerId,
        to,
      }),
      inputs.weightBasis,
    );

    // Only the "nobody reaches a share majority" outcome is worth warning
    // about — the structural reasons (association-owned, no ownership on
    // record) are not something recording a consent causes or fixes.
    return {
      wouldLeaveUnitWithoutRepresentative:
        resolved?.ineligibleReason ===
        ElectorateIneligibleReason.NO_REPRESENTATIVE,
    };
  }
}
