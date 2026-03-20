import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  owners,
  tenantMemberships,
  unitOwnerships,
  units,
  voteUnitConsents,
} from '@/infrastructure/db/schema';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import {
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  ElectorateUnit,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

import { ElectorateService } from '../../application/ports/electorate-service.port';

@Injectable()
export class DrizzleElectorateService implements ElectorateService {
  constructor(private readonly drizzle: DrizzleService) {}

  async resolveElectorate(vote: VoteAggregate): Promise<ElectorateUnit[]> {
    const tenantId = vote.tenantId;

    // 1. Get all units in the tenant
    const allUnits = await this.drizzle.db
      .select()
      .from(units)
      .where(eq(units.tenantId, tenantId));

    if (allUnits.length === 0) return [];

    // 2. Get all ownerships + their linked memberships
    const ownershipRecords = await this.drizzle.db
      .select({
        unitId: unitOwnerships.unitId,
        ownerId: unitOwnerships.ownerId,
        membershipId: tenantMemberships.id,
      })
      .from(unitOwnerships)
      .innerJoin(owners, eq(unitOwnerships.ownerId, owners.id))
      .leftJoin(
        tenantMemberships,
        and(
          eq(owners.userId, tenantMemberships.userId),
          eq(owners.tenantId, tenantMemberships.tenantId),
        ),
      )
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          isNull(unitOwnerships.validTo),
        ),
      );

    // 3. Get all valid consents for this vote
    const consentRecords = await this.drizzle.db
      .select({
        unitId: voteUnitConsents.unitId,
        fromOwnerId: voteUnitConsents.fromOwnerId,
        toMembershipId: voteUnitConsents.toMembershipId,
      })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.voteId, vote.id),
          eq(voteUnitConsents.status, 'VALID'),
        ),
      );

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
          votingWeight: 0,
        });
        continue;
      }

      if (allowIndividualVote) {
        // Each co-owner with a membership gets a separate entry with full unit weight
        const eligibleMemberships = unitOwnerships
          .map((o) => o.membershipId)
          .filter((id): id is string => id !== null);

        if (eligibleMemberships.length === 0) {
          electorate.push({
            unitId: unit.id,
            representativeMembershipId: null,
            eligibilityStatus: ElectorateEligibilityStatus.INELIGIBLE,
            ineligibleReason: ElectorateIneligibleReason.NO_REPRESENTATIVE,
            votingWeight: 0,
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
        // Standard representative logic
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
              votingWeight: 0,
            });
          }
        } else {
          // Co-ownership: need consents from ALL owners pointing to the SAME membership
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
              votingWeight: 0,
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
    // A representative is ready if they have consents from all OTHER co-owners.
    // So we need to find a membership that EVERY owner has consented to.

    const candidates = new Set<string>();
    // Potential candidates are all memberships linked to owners or pointed to by consents
    ownerships.forEach((o) => {
      if (o.membershipId) candidates.add(o.membershipId);
    });
    consents.forEach((c) => candidates.add(c.toMembershipId));

    for (const candidateMid of candidates) {
      let allConsented = true;
      for (const owner of ownerships) {
        // Does this owner agree on candidateMid?
        // They agree if:
        // 1. Their own membership is candidateMid
        // OR 2. They have a consent pointing to candidateMid
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
