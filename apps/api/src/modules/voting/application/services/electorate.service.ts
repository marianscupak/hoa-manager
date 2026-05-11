import { Inject, Injectable } from '@nestjs/common';

import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  ElectorateUnit,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

import {
  ELECTORATE_DATA_REPOSITORY,
  type ElectorateDataRepository,
} from '../ports/electorate-data.repository.port';
import { ElectorateService } from '../ports/electorate-service.port';

@Injectable()
export class ElectorateDomainService implements ElectorateService {
  constructor(
    @Inject(ELECTORATE_DATA_REPOSITORY)
    private readonly electorateDataRepository: ElectorateDataRepository,
  ) {}

  async resolveElectorate(vote: VoteAggregate): Promise<ElectorateUnit[]> {
    const tenantId = vote.tenantId;

    const [allUnits, ownershipRecords, consentRecords] = await Promise.all([
      this.electorateDataRepository.findAllUnits(tenantId),
      this.electorateDataRepository.findOwnershipRecords(tenantId),
      this.electorateDataRepository.findValidConsents(tenantId, vote.id),
    ]);

    if (allUnits.length === 0) return [];

    const allowIndividualVote =
      vote.ruleset?.allowCoOwnerIndividualVote ?? false;
    const weightBasis = vote.ruleset?.weightBasis ?? VoteWeightBasis.UNIT_SHARE;

    const electorate: ElectorateUnit[] = [];

    for (const unit of allUnits) {
      const unitOwnerships = ownershipRecords.filter(
        (o) => o.unitId === unit.id,
      );
      const unitConsents = consentRecords.filter((c) => c.unitId === unit.id);

      const totalWeight =
        weightBasis === VoteWeightBasis.ONE_UNIT_ONE_VOTE
          ? 1.0
          : Number(unit.buildingShare);

      if (unitOwnerships.length === 0) {
        electorate.push({
          unitId: unit.id,
          representativeMembershipId: null,
          eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
          ineligibleReason: ElectorateIneligibleReason.MISSING_OWNERSHIP,
          votingWeight: totalWeight,
        });
        continue;
      }

      if (allowIndividualVote) {
        const eligibleMemberships = unitOwnerships
          .map((o) => o.membershipId)
          .filter((id): id is string => id !== null);

        if (eligibleMemberships.length === 0) {
          electorate.push({
            unitId: unit.id,
            representativeMembershipId: null,
            eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
            ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
            votingWeight: totalWeight,
          });
        } else {
          for (const mid of eligibleMemberships) {
            electorate.push({
              unitId: unit.id,
              representativeMembershipId: mid,
              eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
              ineligibleReason: null,
              votingWeight: totalWeight,
            });
          }
        }
      } else {
        if (unitOwnerships.length === 1) {
          const soleOwnerMid = unitOwnerships[0].membershipId;
          if (soleOwnerMid) {
            electorate.push({
              unitId: unit.id,
              representativeMembershipId: soleOwnerMid,
              eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
              ineligibleReason: null,
              votingWeight: totalWeight,
            });
          } else {
            electorate.push({
              unitId: unit.id,
              representativeMembershipId: null,
              eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
              ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
              votingWeight: totalWeight,
            });
          }
        } else {
          const consensusMembershipId = this.resolveConsensus(
            unitOwnerships,
            unitConsents,
          );

          if (consensusMembershipId) {
            electorate.push({
              unitId: unit.id,
              representativeMembershipId: consensusMembershipId,
              eligibilityStatus: ElectorateEligibilityStatus.ELIGIBLE,
              ineligibleReason: null,
              votingWeight: totalWeight,
            });
          } else {
            electorate.push({
              unitId: unit.id,
              representativeMembershipId: null,
              eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
              ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
              votingWeight: totalWeight,
            });
          }
        }
      }
    }

    return electorate;
  }

  private resolveConsensus(
    ownerships: { ownerId: string; membershipId: string | null }[],
    consents: { fromOwnerId: string; toMembershipId: string }[],
  ): string | null {
    const candidates = new Set<string>();
    ownerships.forEach((o) => {
      if (o.membershipId) candidates.add(o.membershipId);
    });
    consents.forEach((c) => candidates.add(c.toMembershipId));

    for (const candidateMid of candidates) {
      let allConsented = true;
      for (const owner of ownerships) {
        const isSelf = owner.membershipId === candidateMid;
        const hasConsent = consents.some(
          (c) =>
            c.fromOwnerId === owner.ownerId &&
            c.toMembershipId === candidateMid,
        );

        if (!isSelf && !hasConsent) {
          allConsented = false;
          break;
        }
      }
      if (allConsented) return candidateMid;
    }

    return null;
  }
}
