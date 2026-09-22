import { Inject, Injectable } from '@nestjs/common';

import { canonicalizeConsentTargets } from '@/modules/voting/domain/vote/consent-target';
import { resolveElectorateUnits } from '@/modules/voting/domain/vote/electorate-resolution';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateUnit,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

import {
  ELECTORATE_DATA_REPOSITORY,
  type ElectorateDataRepository,
} from '../ports/electorate-data.repository.port';
import { ElectorateService } from '../ports/electorate-service.port';

/**
 * Thin adapter: loads the tenant's units, ownership parties and valid consents
 * and hands them to the pure `resolveElectorateUnits` domain function.
 */
@Injectable()
export class ElectorateDomainService implements ElectorateService {
  constructor(
    @Inject(ELECTORATE_DATA_REPOSITORY)
    private readonly electorateDataRepository: ElectorateDataRepository,
  ) {}

  async resolveElectorate(
    vote: VoteAggregate,
    now: Date,
  ): Promise<ElectorateUnit[]> {
    const [units, parties, storedConsents] = await Promise.all([
      this.electorateDataRepository.findAllUnits(vote.tenantId),
      this.electorateDataRepository.findOwnershipParties(vote.tenantId, now),
      this.electorateDataRepository.findValidConsents(vote.tenantId, vote.id),
    ]);

    const membershipTargets = [
      ...new Set(
        storedConsents.flatMap((c) =>
          c.toMembershipId ? [c.toMembershipId] : [],
        ),
      ),
    ];
    const ownerIdByMembership =
      membershipTargets.length === 0
        ? new Map<string, string>()
        : await this.electorateDataRepository.findOwnerIdsByMembershipIds(
            vote.tenantId,
            membershipTargets,
          );

    const weightBasis = vote.ruleset?.weightBasis ?? VoteWeightBasis.UNIT_SHARE;

    return resolveElectorateUnits(
      units,
      parties.map((p) => ({
        unitId: p.unitId,
        partyType: p.partyType,
        shareNumerator: p.shareNumerator,
        shareDenominator: p.shareDenominator,
        members: p.members,
      })),
      canonicalizeConsentTargets(storedConsents, ownerIdByMembership),
      weightBasis,
    );
  }

  /**
   * The meeting already happened, so the electorate is the owners as they
   * stood on the day — who was in the room, whose names the minutes give, and
   * whose units carried a vote. `CreateVote` and `UpdateVote` refuse a meeting
   * date the ownership register does not reach back to, so this always has
   * records to read.
   */
  async resolveAssemblyElectorate(
    vote: VoteAggregate,
    now: Date,
  ): Promise<ElectorateUnit[]> {
    return await this.resolveElectorate(vote, vote.scheduledFrom ?? now);
  }
}
