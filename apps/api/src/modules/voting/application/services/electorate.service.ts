import { Inject, Injectable } from '@nestjs/common';

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

  async resolveElectorate(vote: VoteAggregate): Promise<ElectorateUnit[]> {
    const [units, parties, consents] = await Promise.all([
      this.electorateDataRepository.findAllUnits(vote.tenantId),
      this.electorateDataRepository.findOwnershipParties(vote.tenantId),
      this.electorateDataRepository.findValidConsents(vote.tenantId, vote.id),
    ]);

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
      consents,
      weightBasis,
    );
  }
}
