import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  isNotNull,
  ne,
  count,
  sum,
  or,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import {
  voteRulesets,
  votes,
  voteQuestions,
  voteOptions,
  voteUnitConsents,
  owners,
  units,
  unitOwnerships,
  tenantMemberships,
} from '@/infrastructure/db/schema';
import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoteQuestionResponseDto,
  type VoterStatusResponseDto,
  type VoterSummaryDto,
  type DelegationCandidateDto,
  type VoteConsentResponseDto,
} from '@/modules/voting/api/dto/vote.dto';
import { type VoteReadRepository } from '@/modules/voting/application/ports/vote-read.repository.port';
import {
  type MajorityRuleType,
  type QuorumElectorateBasis,
  type QuorumMeasure,
  type VoteOptionSemantic,
  type VoteQuestionType,
  type VoteStatus,
  type VoteWeightBasis,
  OwningUnitStatus,
  VoteUnitConsentStatus,
} from '@/modules/voting/domain/vote/vote.types';

@Injectable()
export class DrizzleVoteReadRepository implements VoteReadRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findDetailById(
    tenantId: string,
    id: string,
  ): Promise<VoteDetailResponseDto | null> {
    const rows = await this.drizzle.db
      .select({
        vote: votes,
        ruleset: voteRulesets,
      })
      .from(votes)
      .leftJoin(
        voteRulesets,
        and(eq(votes.id, voteRulesets.voteId), isNull(voteRulesets.questionId)),
      )
      .where(and(eq(votes.tenantId, tenantId), eq(votes.id, id)))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const { vote, ruleset } = rows[0];

    const questionRows = await this.drizzle.db
      .select()
      .from(voteQuestions)
      .where(
        and(eq(voteQuestions.tenantId, tenantId), eq(voteQuestions.voteId, id)),
      )
      .orderBy(voteQuestions.sortOrder);

    const questionIds = questionRows.map((q) => q.id);
    let optionRows: (typeof voteOptions.$inferSelect)[] = [];
    let questionRulesetRows: (typeof voteRulesets.$inferSelect)[] = [];

    if (questionIds.length > 0) {
      optionRows = await this.drizzle.db
        .select()
        .from(voteOptions)
        .where(
          and(
            eq(voteOptions.tenantId, tenantId),
            inArray(voteOptions.questionId, questionIds),
          ),
        )
        .orderBy(voteOptions.sortOrder);

      questionRulesetRows = await this.drizzle.db
        .select()
        .from(voteRulesets)
        .where(
          and(
            eq(voteRulesets.tenantId, tenantId),
            eq(voteRulesets.voteId, id),
            isNotNull(voteRulesets.questionId),
          ),
        );
    }

    const mappedDefaultRuleset = ruleset
      ? {
          weightBasis: ruleset.weightBasis as VoteWeightBasis,
          quorumMeasure: ruleset.quorumMeasure as QuorumMeasure,
          quorumElectorateBasis:
            ruleset.quorumElectorateBasis as QuorumElectorateBasis,
          quorumThreshold: Number(ruleset.quorumThreshold),
          majorityRuleType: ruleset.majorityRuleType as MajorityRuleType,
          majorityThreshold:
            ruleset.majorityThreshold !== null
              ? Number(ruleset.majorityThreshold)
              : null,
          allowAbstain: ruleset.allowAbstain,
          abstainExcludedFromMajorityDenominator:
            ruleset.abstainExcludedFromMajorityDenominator,
          allowCoOwnerIndividualVote: ruleset.allowCoOwnerIndividualVote,
        }
      : null;

    const questions: VoteQuestionResponseDto[] = questionRows.map((q) => {
      const qOptions = optionRows
        .filter((o) => o.questionId === q.id)
        .map((o) => ({
          id: o.id,
          label: o.label,
          sortOrder: o.sortOrder,
          optionKey: o.optionKey as VoteOptionSemantic,
        }));

      const qRulesetRow = questionRulesetRows.find(
        (r) => r.questionId === q.id,
      );
      const qRulesetOverride = qRulesetRow
        ? {
            weightBasis: qRulesetRow.weightBasis as VoteWeightBasis,
            quorumMeasure: qRulesetRow.quorumMeasure as QuorumMeasure,
            quorumElectorateBasis:
              qRulesetRow.quorumElectorateBasis as QuorumElectorateBasis,
            quorumThreshold: Number(qRulesetRow.quorumThreshold),
            majorityRuleType: qRulesetRow.majorityRuleType as MajorityRuleType,
            majorityThreshold:
              qRulesetRow.majorityThreshold !== null
                ? Number(qRulesetRow.majorityThreshold)
                : null,
            allowAbstain: qRulesetRow.allowAbstain,
            abstainExcludedFromMajorityDenominator:
              qRulesetRow.abstainExcludedFromMajorityDenominator,
            allowCoOwnerIndividualVote: qRulesetRow.allowCoOwnerIndividualVote,
          }
        : null;

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.questionType as VoteQuestionType,
        sortOrder: q.sortOrder,
        options: qOptions,
        rulesetOverride: qRulesetOverride,
        effectiveRuleset: qRulesetOverride ?? mappedDefaultRuleset,
      };
    });

    return {
      id: vote.id,
      title: vote.title,
      description: vote.description ?? null,
      scheduledFrom: vote.scheduledFrom ?? null,
      scheduledTo: vote.scheduledTo ?? null,
      status: vote.status as VoteStatus,
      ruleset: mappedDefaultRuleset,
      questions,
    };
  }

  async findVotes(
    tenantId: string,
    statuses?: VoteStatus[],
  ): Promise<VoteListItemResponseDto[]> {
    const whereClause =
      statuses && statuses.length > 0
        ? and(eq(votes.tenantId, tenantId), inArray(votes.status, statuses))
        : eq(votes.tenantId, tenantId);

    const rows = await this.drizzle.db
      .select({
        id: votes.id,
        title: votes.title,
        description: votes.description,
        status: votes.status,
        scheduledFrom: votes.scheduledFrom,
        scheduledTo: votes.scheduledTo,
        createdAt: votes.createdAt,
        allowCoOwnerIndividualVote: voteRulesets.allowCoOwnerIndividualVote,
      })
      .from(votes)
      .leftJoin(
        voteRulesets,
        and(eq(votes.id, voteRulesets.voteId), isNull(voteRulesets.questionId)),
      )
      .where(whereClause)
      .orderBy((votes) => [desc(votes.createdAt)]);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      status: row.status as VoteStatus,
      scheduledFrom: row.scheduledFrom ?? null,
      scheduledTo: row.scheduledTo ?? null,
      allowCoOwnerIndividualVote: row.allowCoOwnerIndividualVote ?? false,
    }));
  }

  /**
   * Resolves a membershipId to the single ownerId in a tenant.
   * Returns `null` if the membership or owner does not exist.
   */
  private async resolveOwnerId(
    tenantId: string,
    membershipId: string,
  ): Promise<string | null> {
    const membershipRows = await this.drizzle.db
      .select({ userId: tenantMemberships.userId })
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.id, membershipId),
        ),
      )
      .limit(1);

    if (membershipRows.length === 0) return null;

    const ownerRows = await this.drizzle.db
      .select({ id: owners.id })
      .from(owners)
      .where(
        and(
          eq(owners.tenantId, tenantId),
          eq(owners.userId, membershipRows[0].userId),
        ),
      )
      .limit(1);

    return ownerRows.length > 0 ? ownerRows[0].id : null;
  }

  /**
   * Returns unique unit IDs actively owned by an owner.
   */
  private async findOwnedUnitIds(
    tenantId: string,
    ownerId: string,
  ): Promise<string[]> {
    const rows = await this.drizzle.db
      .select({ unitId: unitOwnerships.unitId })
      .from(unitOwnerships)
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.ownerId, ownerId),
          isNull(unitOwnerships.validTo),
        ),
      );

    return [...new Set(rows.map((r) => r.unitId))];
  }

  /**
   * Counts the total number of active owners per unit.
   */
  private async getCoOwnerCounts(
    tenantId: string,
    unitIds: string[],
  ): Promise<Map<string, number>> {
    if (unitIds.length === 0) return new Map();

    const rows = await this.drizzle.db
      .select({
        unitId: unitOwnerships.unitId,
        ownerCount: count(unitOwnerships.id),
      })
      .from(unitOwnerships)
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.unitId, unitIds),
          isNull(unitOwnerships.validTo),
        ),
      )
      .groupBy(unitOwnerships.unitId);

    return new Map(rows.map((r) => [r.unitId, Number(r.ownerCount)]));
  }

  /**
   * Returns the `allowCoOwnerIndividualVote` flag from the vote-level ruleset.
   */
  private async getAllowCoOwnerIndividualVote(
    tenantId: string,
    voteId: string,
  ): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({
        allowCoOwnerIndividualVote: voteRulesets.allowCoOwnerIndividualVote,
      })
      .from(voteRulesets)
      .where(
        and(
          eq(voteRulesets.tenantId, tenantId),
          eq(voteRulesets.voteId, voteId),
          isNull(voteRulesets.questionId),
        ),
      )
      .limit(1);

    return rows.length > 0 ? rows[0].allowCoOwnerIndividualVote : false;
  }

  /**
   * Counts valid consents per unit pointing to a specific membership.
   */
  private async getConsentCounts(
    tenantId: string,
    voteId: string,
    unitIds: string[],
    membershipId: string,
  ): Promise<Map<string, number>> {
    if (unitIds.length === 0) return new Map();

    const rows = await this.drizzle.db
      .select({
        unitId: voteUnitConsents.unitId,
        consentCount: count(voteUnitConsents.id),
      })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.voteId, voteId),
          inArray(voteUnitConsents.unitId, unitIds),
          eq(voteUnitConsents.toMembershipId, membershipId),
          eq(voteUnitConsents.status, 'VALID'),
        ),
      )
      .groupBy(voteUnitConsents.unitId);

    return new Map(rows.map((r) => [r.unitId, Number(r.consentCount)]));
  }

  /**
   * Returns unit IDs for which the current membership (via their owner) has given consent.
   */
  private async getGivenConsentUnits(
    tenantId: string,
    voteId: string,
    ownerId: string,
    unitIds: string[],
  ): Promise<Set<string>> {
    if (unitIds.length === 0) return new Set();

    const rows = await this.drizzle.db
      .select({ unitId: voteUnitConsents.unitId })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.voteId, voteId),
          inArray(voteUnitConsents.unitId, unitIds),
          eq(voteUnitConsents.fromOwnerId, ownerId),
          eq(voteUnitConsents.status, 'VALID'),
        ),
      );

    return new Set(rows.map((r) => r.unitId));
  }

  /**
   * Determines per-unit delegation status given co-owner counts, consents,
   * and the `allowCoOwnerIndividualVote` flag.
   *
   * Returns `{ hasReady, hasRequiresDelegation, hasDelegated }`.
   */
  private computeUnitDelegationStatus(
    unitIds: string[],
    ownerCountMap: Map<string, number>,
    consentCountMap: Map<string, number>,
    givenConsentUnits: Set<string>,
    allowIndividualVote: boolean,
  ): {
    hasReady: boolean;
    hasRequiresDelegation: boolean;
    hasDelegated: boolean;
  } {
    let hasReady = false;
    let hasRequiresDelegation = false;
    let hasDelegated = false;

    for (const unitId of unitIds) {
      if (givenConsentUnits.has(unitId)) {
        hasDelegated = true;
        continue;
      }

      const ownerCount = ownerCountMap.get(unitId) ?? 1;
      const isSoleOwner = ownerCount === 1;

      if (isSoleOwner || allowIndividualVote) {
        hasReady = true;
      } else {
        const consents = consentCountMap.get(unitId) ?? 0;
        // A representative is ready if they have consents from all OTHER co-owners.
        if (consents >= ownerCount - 1) {
          hasReady = true;
        } else {
          hasRequiresDelegation = true;
        }
      }
    }

    return { hasReady, hasRequiresDelegation, hasDelegated };
  }

  // ── Public methods ────────────────────────────────────────────────

  async findVoterStatus(
    tenantId: string,
    voteId: string,
    membershipId: string,
  ): Promise<VoterStatusResponseDto> {
    const emptyResult: VoterStatusResponseDto = {
      canVote: false,
      totalVotingPower: { value: 0, maximum: 0 },
      owningUnits: [],
    };

    const ownerId = await this.resolveOwnerId(tenantId, membershipId);
    if (!ownerId) return emptyResult;

    // Fetch ownerships with unit details (needed for building the response)
    const ownershipRows = await this.drizzle.db
      .select({
        unitId: unitOwnerships.unitId,
        unitNo: units.unitNo,
        buildingShare: units.buildingShare,
      })
      .from(unitOwnerships)
      .innerJoin(units, eq(unitOwnerships.unitId, units.id))
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.ownerId, ownerId),
          isNull(unitOwnerships.validTo),
        ),
      );

    if (ownershipRows.length === 0) return emptyResult;

    const uniqueUnitIds = [...new Set(ownershipRows.map((o) => o.unitId))];

    const [
      allowIndividualVote,
      ownerCountMap,
      receivedConsentCountMap,
      givenConsentUnits,
    ] = await Promise.all([
      this.getAllowCoOwnerIndividualVote(tenantId, voteId),
      this.getCoOwnerCounts(tenantId, uniqueUnitIds),
      this.getConsentCounts(tenantId, voteId, uniqueUnitIds, membershipId),
      this.getGivenConsentUnits(tenantId, voteId, ownerId, uniqueUnitIds),
    ]);

    // Compute total voting power (sum of all building shares in the tenant)
    const totalShareRows = await this.drizzle.db
      .select({ total: sum(units.buildingShare) })
      .from(units)
      .where(eq(units.tenantId, tenantId));

    const totalMaximum = totalShareRows[0]?.total
      ? Number(totalShareRows[0].total)
      : 0;

    // Build unit statuses
    let totalValue = 0;
    let hasReady = false;

    const owningUnits = uniqueUnitIds.map((unitId) => {
      const ownership = ownershipRows.find((o) => o.unitId === unitId)!;
      const ownerCount = ownerCountMap.get(unitId) ?? 1;
      const isSoleOwner = ownerCount === 1;
      const share = Number(ownership.buildingShare);

      let status: OwningUnitStatus;

      const receivedConsents = receivedConsentCountMap.get(unitId) ?? 0;
      const isGiven = givenConsentUnits.has(unitId);

      if (isGiven) {
        status = OwningUnitStatus.DELEGATED;
      } else if (
        isSoleOwner ||
        allowIndividualVote ||
        receivedConsents >= ownerCount - 1
      ) {
        status = OwningUnitStatus.READY;
        totalValue += share;
        hasReady = true;
      } else {
        status = OwningUnitStatus.REQUIRES_DELEGATION;
      }

      return {
        id: unitId,
        name: ownership.unitNo,
        share: `${share}/${totalMaximum}`,
        status,
      };
    });

    return {
      canVote: hasReady,
      totalVotingPower: { value: totalValue, maximum: totalMaximum },
      owningUnits,
    };
  }

  async findVoterSummariesForVotes(
    tenantId: string,
    voteIds: string[],
    membershipId: string,
  ): Promise<Map<string, VoterSummaryDto>> {
    const result = new Map<string, VoterSummaryDto>();
    if (voteIds.length === 0) return result;

    const noVoteSummary: VoterSummaryDto = {
      canVote: false,
      requiresDelegation: false,
      isDelegated: false,
    };

    const ownerId = await this.resolveOwnerId(tenantId, membershipId);
    if (!ownerId) {
      for (const id of voteIds) result.set(id, noVoteSummary);
      return result;
    }

    const unitIds = await this.findOwnedUnitIds(tenantId, ownerId);
    if (unitIds.length === 0) {
      for (const id of voteIds) result.set(id, noVoteSummary);
      return result;
    }

    const ownerCountMap = await this.getCoOwnerCounts(tenantId, unitIds);

    for (const voteId of voteIds) {
      const [allowIndividualVote, consentCountMap, givenConsentUnits] =
        await Promise.all([
          this.getAllowCoOwnerIndividualVote(tenantId, voteId),
          this.getConsentCounts(tenantId, voteId, unitIds, membershipId),
          this.getGivenConsentUnits(tenantId, voteId, ownerId, unitIds),
        ]);

      const { hasReady, hasRequiresDelegation, hasDelegated } =
        this.computeUnitDelegationStatus(
          unitIds,
          ownerCountMap,
          consentCountMap,
          givenConsentUnits,
          allowIndividualVote,
        );

      result.set(voteId, {
        canVote: hasReady,
        requiresDelegation: hasRequiresDelegation,
        isDelegated: hasDelegated,
      });
    }

    return result;
  }

  async findDelegationCandidates(
    tenantId: string,
    voteId: string,
    unitId: string,
    forMembershipId: string | undefined,
    requesterMembershipId: string,
  ): Promise<DelegationCandidateDto[]> {
    const records = await this.drizzle.db
      .select({
        membershipId: tenantMemberships.id,
        name: owners.displayName,
        delegateMembershipId: voteUnitConsents.toMembershipId,
        hasConsent: isNotNull(voteUnitConsents.id),
        isUnitOwner: isNotNull(unitOwnerships.id),
      })
      .from(tenantMemberships)
      .innerJoin(owners, eq(owners.userId, tenantMemberships.userId))
      .innerJoin(
        unitOwnerships,
        and(
          eq(unitOwnerships.ownerId, owners.id),
          eq(unitOwnerships.unitId, unitId),
          isNull(unitOwnerships.validTo),
        ),
      )
      .leftJoin(
        voteUnitConsents,
        and(
          eq(voteUnitConsents.unitId, unitId),
          eq(voteUnitConsents.voteId, voteId),
          eq(voteUnitConsents.fromOwnerId, owners.id),
          eq(voteUnitConsents.status, 'VALID'),
        ),
      )
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.status, 'ACTIVE'),
          forMembershipId ? ne(tenantMemberships.id, forMembershipId) : undefined,
        ),
      )
      .orderBy(owners.displayName);

    return records.map((r) => ({
      membershipId: r.membershipId,
      name: r.name,
      hasDelegatedToRequester: r.delegateMembershipId === requesterMembershipId,
      isEligible: !r.hasConsent,
      isUnitOwner: !!r.isUnitOwner,
    }));
  }

  async findConsents(
    tenantId: string,
    membershipId: string,
    isAdmin: boolean,
  ): Promise<VoteConsentResponseDto[]> {
    let whereClause = and(
      eq(voteUnitConsents.tenantId, tenantId),
      eq(voteUnitConsents.status, VoteUnitConsentStatus.VALID),
    );

    if (!isAdmin) {
      const ownerId = await this.resolveOwnerId(tenantId, membershipId);

      if (!ownerId) {
        whereClause = and(
          whereClause,
          eq(voteUnitConsents.toMembershipId, membershipId),
        );
      } else {
        whereClause = and(
          whereClause,
          or(
            eq(voteUnitConsents.fromOwnerId, ownerId),
            eq(voteUnitConsents.toMembershipId, membershipId),
          ),
        );
      }
    }

    const delegateOwners = alias(owners, 'delegate_owners');
    const delegateMemberships = alias(
      tenantMemberships,
      'delegate_memberships',
    );

    const rows = await this.drizzle.db
      .select({
        id: voteUnitConsents.id,
        voteId: voteUnitConsents.voteId,
        voteTitle: votes.title,
        voteStatus: votes.status,
        voteScheduledFrom: votes.scheduledFrom,
        unitId: voteUnitConsents.unitId,
        unitName: units.unitNo,
        fromOwnerId: voteUnitConsents.fromOwnerId,
        fromOwnerName: owners.displayName,
        toMembershipId: voteUnitConsents.toMembershipId,
        toDelegateName: delegateOwners.displayName,
        recordedByMembershipId: voteUnitConsents.recordedByMembershipId,
        createdAt: voteUnitConsents.createdAt,
      })
      .from(voteUnitConsents)
      .innerJoin(votes, eq(voteUnitConsents.voteId, votes.id))
      .innerJoin(units, eq(voteUnitConsents.unitId, units.id))
      .innerJoin(owners, eq(voteUnitConsents.fromOwnerId, owners.id))
      .innerJoin(
        delegateMemberships,
        eq(voteUnitConsents.toMembershipId, delegateMemberships.id),
      )
      .innerJoin(
        delegateOwners,
        and(
          eq(delegateMemberships.userId, delegateOwners.userId),
          eq(delegateOwners.tenantId, tenantId),
        ),
      )
      .where(whereClause);

    return rows.map((r) => ({
      id: r.id,
      voteId: r.voteId,
      voteTitle: r.voteTitle,
      voteStatus: r.voteStatus as VoteStatus,
      voteScheduledFrom: r.voteScheduledFrom,
      unitId: r.unitId,
      unitName: r.unitName,
      fromOwnerId: r.fromOwnerId,
      fromOwnerName: r.fromOwnerName,
      toMembershipId: r.toMembershipId,
      toDelegateName: r.toDelegateName,
      recordedByMembershipId: r.recordedByMembershipId,
      createdAt: r.createdAt,
    }));
  }

  async getOwnerIdByMembership(
    tenantId: string,
    membershipId: string,
  ): Promise<string | null> {
    return this.resolveOwnerId(tenantId, membershipId);
  }

  async hasMutualDelegation(
    tenantId: string,
    unitId: string,
    voteId: string,
    delegatorMembershipId: string,
    delegateMembershipId: string,
  ): Promise<boolean> {
    const mutualConsent = await this.drizzle.db
      .select({ id: voteUnitConsents.id })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.unitId, unitId),
          eq(voteUnitConsents.voteId, voteId),
          eq(voteUnitConsents.status, VoteUnitConsentStatus.VALID),
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.toMembershipId, delegatorMembershipId),
          eq(
            voteUnitConsents.fromOwnerId,
            this.drizzle.db
              .select({ id: owners.id })
              .from(tenantMemberships)
              .innerJoin(owners, eq(owners.userId, tenantMemberships.userId))
              .where(eq(tenantMemberships.id, delegateMembershipId)),
          ),
        ),
      )
      .limit(1);

    return mutualConsent.length > 0;
  }

  async isOwnerOfConsent(
    tenantId: string,
    consentId: string,
    membershipId: string,
  ): Promise<boolean> {
    const ownerId = await this.resolveOwnerId(tenantId, membershipId);
    if (!ownerId) return false;

    const consentRows = await this.drizzle.db
      .select({ id: voteUnitConsents.id })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.id, consentId),
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.fromOwnerId, ownerId),
        ),
      )
      .limit(1);

    return consentRows.length > 0;
  }
}
