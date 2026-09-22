import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, isNotNull, ne, or } from 'drizzle-orm';
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
  unitOwnershipMembers,
  tenantMemberships,
  users,
  voteElectorateUnits,
  ballots,
  ballotAnswers,
  voteResults,
  voteQuestionResults,
  voteOptionResults,
  voteDocuments,
  ownershipActiveAt,
} from '@/infrastructure/db/schema';
import {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import {
  toFractionDto,
  toPercentString,
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoteQuestionResponseDto,
  type VoterStatusResponseDto,
  type VoterSummaryDto,
  type DelegationCandidateDto,
  type VoteConsentResponseDto,
  type VoteResultsResponseDto,
  type QuestionOutcomeDto,
  type VoteParticipationUnitDto,
  type ParticipationAnswerDto,
} from '@/modules/voting/api/dto/vote.dto';
import {
  type AssemblyUnitContext,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { canonicalizeConsentTargets } from '@/modules/voting/domain/vote/consent-target';
import { channelMembershipIdFromParties } from '@/modules/voting/domain/vote/electorate-channel';
import {
  resolveElectorateUnits,
  type ElectorateConsentInput,
  type ElectoratePartyInput,
  type ElectorateUnitInput,
} from '@/modules/voting/domain/vote/electorate-resolution';
import {
  deriveOwningUnitStatus,
  type ElectoratePhase,
} from '@/modules/voting/domain/vote/owning-unit-status';
import { deriveQuestionOutcome } from '@/modules/voting/domain/vote/question-outcome';
import {
  type ElectorateUnit,
  type ThresholdComparator,
  type VoteMode,
  type VoteOptionSemantic,
  type VoteQuestionType,
  type VoteStatus,
  OwningUnitStatus,
  VoteUnitConsentStatus,
  ElectorateEligibilityStatus,
  ElectorateIneligibleReason,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';
import { Rational } from '@/shared/domain/rational';

import { channelMembershipIdSql } from './electorate-channel.sql';
import { findOwnerIdsByMembershipIds } from './owner-lookup';
import { mapRulesetRow } from './vote-ruleset.mapper';

/** A resolved electorate row plus the account that may cast for it now. */
type ResolvedElectorateUnit = ElectorateUnit & {
  channelMembershipId: string | null;
};

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

    const mappedDefaultRuleset = ruleset ? mapRulesetRow(ruleset) : null;

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
      const qRulesetOverride = qRulesetRow ? mapRulesetRow(qRulesetRow) : null;

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

    const documentRows = await this.drizzle.db
      .select()
      .from(voteDocuments)
      .where(
        and(
          eq(voteDocuments.tenantId, tenantId),
          eq(voteDocuments.voteId, id),
          eq(voteDocuments.status, 'UPLOADED'),
          eq(voteDocuments.kind, 'VOTE'),
        ),
      )
      .orderBy(voteDocuments.createdAt);

    return {
      id: vote.id,
      title: vote.title,
      description: vote.description ?? null,
      scheduledFrom: vote.scheduledFrom ?? null,
      scheduledTo: vote.scheduledTo ?? null,
      status: vote.status as VoteStatus,
      mode: vote.mode as VoteMode,
      ruleset: mappedDefaultRuleset,
      questions,
      documents: documentRows.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        contentType: d.contentType,
        sizeBytes: d.sizeBytes,
        // updatedAt is the confirm time — nothing updates a row after UPLOADED
        uploadedAt: d.updatedAt,
      })),
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
        mode: votes.mode,
      })
      .from(votes)
      .where(whereClause)
      .orderBy((votes) => [desc(votes.createdAt)]);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      status: row.status as VoteStatus,
      mode: row.mode as VoteMode,
      scheduledFrom: row.scheduledFrom ?? null,
      scheduledTo: row.scheduledTo ?? null,
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
    now: Date,
  ): Promise<string[]> {
    const rows = await this.drizzle.db
      .select({ unitId: unitOwnerships.unitId })
      .from(unitOwnerships)
      .innerJoin(
        unitOwnershipMembers,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnershipMembers.ownerId, ownerId),
          ownershipActiveAt(now),
        ),
      );

    return [...new Set(rows.map((r) => r.unitId))];
  }

  /**
   * Units this membership is recorded as representing, per vote — units it may
   * hold without owning any share of them, which is why they are looked up
   * separately from ownership. Before a vote opens the consents are the source
   * of truth (a consent only *proposes* a representative; the electorate
   * decides, so callers must still check the resolved row), afterwards the
   * frozen snapshot is.
   */
  private async findRepresentedUnitIdsByVote(
    tenantId: string,
    membershipId: string,
    snapshotVoteIds: string[],
    previewVoteIds: string[],
  ): Promise<Map<string, Set<string>>> {
    const byVote = new Map<string, Set<string>>();
    const add = (voteId: string, unitId: string) => {
      const units = byVote.get(voteId) ?? new Set<string>();
      units.add(unitId);
      byVote.set(voteId, units);
    };

    if (previewVoteIds.length > 0) {
      const ownerId = await this.resolveOwnerId(tenantId, membershipId);
      const consentRows = await this.drizzle.db
        .select({
          voteId: voteUnitConsents.voteId,
          unitId: voteUnitConsents.unitId,
        })
        .from(voteUnitConsents)
        .where(
          and(
            eq(voteUnitConsents.tenantId, tenantId),
            inArray(voteUnitConsents.voteId, previewVoteIds),
            ownerId
              ? or(
                  eq(voteUnitConsents.toMembershipId, membershipId),
                  eq(voteUnitConsents.toOwnerId, ownerId),
                )
              : eq(voteUnitConsents.toMembershipId, membershipId),
            eq(voteUnitConsents.status, VoteUnitConsentStatus.VALID),
          ),
        );
      for (const row of consentRows) add(row.voteId, row.unitId);
    }

    if (snapshotVoteIds.length > 0) {
      const snapshotRows = await this.drizzle.db
        .select({
          voteId: voteElectorateUnits.voteId,
          unitId: voteElectorateUnits.unitId,
        })
        .from(voteElectorateUnits)
        .where(
          and(
            eq(voteElectorateUnits.tenantId, tenantId),
            inArray(voteElectorateUnits.voteId, snapshotVoteIds),
            eq(channelMembershipIdSql(), membershipId),
          ),
        );
      for (const row of snapshotRows) add(row.voteId, row.unitId);
    }

    return byVote;
  }

  /** `findRepresentedUnitIdsByVote` for a single vote. */
  private async findRepresentedUnitIds(
    tenantId: string,
    voteId: string,
    membershipId: string,
    fromSnapshot: boolean,
  ): Promise<string[]> {
    const byVote = await this.findRepresentedUnitIdsByVote(
      tenantId,
      membershipId,
      fromSnapshot ? [voteId] : [],
      fromSnapshot ? [] : [voteId],
    );

    return [...(byVote.get(voteId) ?? [])];
  }

  /** Unit number and building share, for the units a voter status lists. */
  async findAssemblyUnitContext(
    tenantId: string,
    voteId: string,
    now: Date,
  ): Promise<AssemblyUnitContext[]> {
    // Every unit in the building, not just those in a snapshot: an assembly
    // record has no electorate snapshot until it is published, and the roster
    // has to list the whole house.
    const unitRows = await this.drizzle.db
      .select({ unitId: units.id, unitNo: units.unitNo })
      .from(units)
      .where(eq(units.tenantId, tenantId))
      .orderBy(units.unitNo);

    const unitIds = unitRows.map((u) => u.unitId);
    if (unitIds.length === 0) return [];

    const ownerRows = await this.drizzle.db
      .select({
        unitId: unitOwnerships.unitId,
        ownerId: owners.id,
        displayName: owners.displayName,
      })
      .from(unitOwnerships)
      .innerJoin(
        unitOwnershipMembers,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.unitId, unitIds),
          ownershipActiveAt(now),
        ),
      );

    const answerRows = await this.drizzle.db
      .select({
        unitId: ballots.unitId,
        questionId: ballotAnswers.questionId,
        optionId: ballotAnswers.optionId,
      })
      .from(ballots)
      .innerJoin(ballotAnswers, eq(ballotAnswers.ballotId, ballots.id))
      .where(and(eq(ballots.tenantId, tenantId), eq(ballots.voteId, voteId)));

    const ownersByUnit = new Map<
      string,
      { ownerId: string; displayName: string }[]
    >();
    for (const row of ownerRows) {
      const list = ownersByUnit.get(row.unitId) ?? [];
      list.push({ ownerId: row.ownerId, displayName: row.displayName });
      ownersByUnit.set(row.unitId, list);
    }

    const answersByUnit = new Map<
      string,
      { questionId: string; optionId: string }[]
    >();
    for (const row of answerRows) {
      const list = answersByUnit.get(row.unitId) ?? [];
      list.push({ questionId: row.questionId, optionId: row.optionId });
      answersByUnit.set(row.unitId, list);
    }

    return unitRows.map((u) => ({
      unitId: u.unitId,
      unitNo: u.unitNo,
      owners: ownersByUnit.get(u.unitId) ?? [],
      answers: answersByUnit.get(u.unitId) ?? [],
    }));
  }

  private async loadUnitDisplayInfo(
    tenantId: string,
    unitIds: string[],
  ): Promise<Map<string, { name: string; share: string }>> {
    if (unitIds.length === 0) return new Map();

    const rows = await this.drizzle.db
      .select({
        id: units.id,
        unitNo: units.unitNo,
        buildingShareNumerator: units.buildingShareNumerator,
        buildingShareDenominator: units.buildingShareDenominator,
      })
      .from(units)
      .where(and(eq(units.tenantId, tenantId), inArray(units.id, unitIds)));

    return new Map(
      rows.map((r) => [
        r.id,
        {
          name: r.unitNo,
          share: `${r.buildingShareNumerator}/${r.buildingShareDenominator}`,
        },
      ]),
    );
  }

  /**
   * The resolved electorate row per unit: read back from the frozen snapshot
   * once the vote has opened, previewed live before that. Both shapes feed
   * `deriveOwningUnitStatus`, so a status never depends on which phase it
   * came from.
   */
  private async resolveElectorateForUnits(
    tenantId: string,
    voteId: string,
    unitIds: string[],
    now: Date,
    fromSnapshot: boolean,
  ): Promise<Map<string, ResolvedElectorateUnit>> {
    if (!fromSnapshot) {
      const preview = await this.previewElectorate(
        tenantId,
        voteId,
        unitIds,
        now,
      );
      return new Map(preview.map((r) => [r.unitId, r]));
    }

    const rows = await this.drizzle.db
      .select({
        unitId: voteElectorateUnits.unitId,
        representativeMembershipId:
          voteElectorateUnits.representativeMembershipId,
        representativeOwnerId: voteElectorateUnits.representativeOwnerId,
        channelMembershipId: channelMembershipIdSql(),
        eligibilityStatus: voteElectorateUnits.eligibilityStatus,
        ineligibleReason: voteElectorateUnits.ineligibleReason,
        weightNumerator: voteElectorateUnits.weightNumerator,
        weightDenominator: voteElectorateUnits.weightDenominator,
      })
      .from(voteElectorateUnits)
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
          inArray(voteElectorateUnits.unitId, unitIds),
        ),
      );

    return new Map(
      rows.map((r) => [
        r.unitId,
        {
          unitId: r.unitId,
          representativeMembershipId: r.representativeMembershipId,
          representativeOwnerId: r.representativeOwnerId,
          channelMembershipId: r.channelMembershipId,
          eligibilityStatus: r.eligibilityStatus as ElectorateEligibilityStatus,
          ineligibleReason:
            r.ineligibleReason as ElectorateIneligibleReason | null,
          weightNum: r.weightNumerator,
          weightDen: r.weightDenominator,
        },
      ]),
    );
  }

  async loadElectorateInputs(
    tenantId: string,
    voteId: string,
    unitIds: string[],
    now: Date,
  ): Promise<{
    units: ElectorateUnitInput[];
    parties: ElectoratePartyInput[];
    consents: ElectorateConsentInput[];
    weightBasis: VoteWeightBasis;
  }> {
    const [plan, consents, weightBasis] = await Promise.all([
      this.loadOwnershipPlan(tenantId, unitIds, now),
      this.loadValidConsents(tenantId, voteId, unitIds),
      this.getWeightBasis(tenantId, voteId),
    ]);

    return { ...plan, consents, weightBasis };
  }

  /**
   * Loads the units and their active ownership parties in the shape the
   * `resolveElectorateUnits` domain function consumes.
   */
  private async loadOwnershipPlan(
    tenantId: string,
    unitIds: string[],
    now: Date,
  ): Promise<{
    units: ElectorateUnitInput[];
    parties: ElectoratePartyInput[];
  }> {
    if (unitIds.length === 0) return { units: [], parties: [] };

    const unitRows = await this.drizzle.db
      .select({
        id: units.id,
        buildingShareNumerator: units.buildingShareNumerator,
        buildingShareDenominator: units.buildingShareDenominator,
      })
      .from(units)
      .where(and(eq(units.tenantId, tenantId), inArray(units.id, unitIds)));

    const memberRows = await this.drizzle.db
      .select({
        ownershipId: unitOwnerships.id,
        unitId: unitOwnerships.unitId,
        partyType: unitOwnerships.partyType,
        shareNumerator: unitOwnerships.shareNumerator,
        shareDenominator: unitOwnerships.shareDenominator,
        ownerId: unitOwnershipMembers.ownerId,
        ownerKind: owners.kind,
        membershipId: tenantMemberships.id,
      })
      .from(unitOwnerships)
      .innerJoin(
        unitOwnershipMembers,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .leftJoin(
        tenantMemberships,
        and(
          eq(owners.userId, tenantMemberships.userId),
          eq(owners.tenantId, tenantMemberships.tenantId),
          eq(tenantMemberships.status, 'ACTIVE'),
        ),
      )
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.unitId, unitIds),
          ownershipActiveAt(now),
        ),
      );

    const partiesById = new Map<string, ElectoratePartyInput>();
    for (const row of memberRows) {
      const party = partiesById.get(row.ownershipId) ?? {
        unitId: row.unitId,
        partyType: row.partyType as OwnershipPartyType,
        shareNumerator: row.shareNumerator,
        shareDenominator: row.shareDenominator,
        members: [],
      };
      party.members.push({
        ownerId: row.ownerId,
        ownerKind: row.ownerKind as OwnerKind,
        membershipId: row.membershipId,
      });
      partiesById.set(row.ownershipId, party);
    }

    return { units: unitRows, parties: [...partiesById.values()] };
  }

  /** Valid consents recorded for one vote, limited to the given units. */
  private async loadValidConsents(
    tenantId: string,
    voteId: string,
    unitIds: string[],
  ): Promise<ElectorateConsentInput[]> {
    if (unitIds.length === 0) return [];

    const rows = await this.drizzle.db
      .select({
        unitId: voteUnitConsents.unitId,
        fromOwnerId: voteUnitConsents.fromOwnerId,
        toOwnerId: voteUnitConsents.toOwnerId,
        toMembershipId: voteUnitConsents.toMembershipId,
      })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.voteId, voteId),
          inArray(voteUnitConsents.unitId, unitIds),
          eq(voteUnitConsents.status, VoteUnitConsentStatus.VALID),
        ),
      );

    const membershipTargets = [
      ...new Set(
        rows.flatMap((r) => (r.toMembershipId ? [r.toMembershipId] : [])),
      ),
    ];
    const ownerIdByMembership = await findOwnerIdsByMembershipIds(
      this.drizzle.db,
      tenantId,
      membershipTargets,
    );
    return canonicalizeConsentTargets(rows, ownerIdByMembership);
  }

  /** Vote-level weight basis; defaults exactly as `ElectorateDomainService` does. */
  private async getWeightBasis(
    tenantId: string,
    voteId: string,
  ): Promise<VoteWeightBasis> {
    const rows = await this.drizzle.db
      .select({ weightBasis: voteRulesets.weightBasis })
      .from(voteRulesets)
      .where(
        and(
          eq(voteRulesets.tenantId, tenantId),
          eq(voteRulesets.voteId, voteId),
          isNull(voteRulesets.questionId),
        ),
      )
      .limit(1);

    return (
      (rows[0]?.weightBasis as VoteWeightBasis) ?? VoteWeightBasis.UNIT_SHARE
    );
  }

  /**
   * Live electorate preview for a vote that has not opened yet, produced by
   * the same domain function that builds the open-time snapshot — so what an
   * owner is shown in DRAFT/SCHEDULED is what they will get at open.
   */
  private async previewElectorate(
    tenantId: string,
    voteId: string,
    unitIds: string[],
    now: Date,
    plan?: { units: ElectorateUnitInput[]; parties: ElectoratePartyInput[] },
  ): Promise<ResolvedElectorateUnit[]> {
    const ownershipPlan =
      plan ?? (await this.loadOwnershipPlan(tenantId, unitIds, now));
    const [consents, weightBasis] = await Promise.all([
      this.loadValidConsents(tenantId, voteId, unitIds),
      this.getWeightBasis(tenantId, voteId),
    ]);

    const rows = resolveElectorateUnits(
      ownershipPlan.units,
      ownershipPlan.parties,
      consents,
      weightBasis,
    );
    return rows.map((row) => ({
      ...row,
      channelMembershipId: channelMembershipIdFromParties(
        row,
        ownershipPlan.parties,
      ),
    }));
  }

  private async getVotedUnits(
    tenantId: string,
    voteId: string,
    unitIds: string[],
  ): Promise<Set<string>> {
    if (unitIds.length === 0) return new Set();

    const rows = await this.drizzle.db
      .select({ unitId: ballots.unitId })
      .from(ballots)
      .where(
        and(
          eq(ballots.tenantId, tenantId),
          eq(ballots.voteId, voteId),
          inArray(ballots.unitId, unitIds),
        ),
      );

    return new Set(rows.map((r) => r.unitId));
  }

  // ── Public methods ────────────────────────────────────────────────

  async findVoterStatus(
    tenantId: string,
    voteId: string,
    membershipId: string,
    now: Date,
  ): Promise<VoterStatusResponseDto> {
    const emptyResult: VoterStatusResponseDto = {
      canVote: false,
      totalVotingPower: {
        value: Rational.zero().toDecimalString(4),
        maximum: Rational.zero().toDecimalString(4),
      },
      owningUnits: [],
    };

    const voteRow = await this.drizzle.db
      .select({ status: votes.status })
      .from(votes)
      .where(and(eq(votes.tenantId, tenantId), eq(votes.id, voteId)))
      .limit(1);

    const fromSnapshot =
      voteRow.length > 0 &&
      (voteRow[0].status === 'OPEN' || voteRow[0].status === 'CLOSED');

    const ownerId = await this.resolveOwnerId(tenantId, membershipId);
    const ownedUnitIds = new Set(
      ownerId ? await this.findOwnedUnitIds(tenantId, ownerId, now) : [],
    );

    // A member chosen to vote for someone else's unit may own nothing at all,
    // so the units they act on are the union of both roles — never ownership
    // alone.
    const representedUnitIds = await this.findRepresentedUnitIds(
      tenantId,
      voteId,
      membershipId,
      fromSnapshot,
    );

    const unitIds = [...new Set([...ownedUnitIds, ...representedUnitIds])];
    if (unitIds.length === 0) return emptyResult;

    const [unitInfo, resolvedByUnit, votedUnits, totalMaximum] =
      await Promise.all([
        this.loadUnitDisplayInfo(tenantId, unitIds),
        this.resolveElectorateForUnits(
          tenantId,
          voteId,
          unitIds,
          now,
          fromSnapshot,
        ),
        this.getVotedUnits(tenantId, voteId, unitIds),
        this.getTenantTotalShare(tenantId),
      ]);

    const phase: ElectoratePhase = fromSnapshot ? 'SNAPSHOT' : 'PREVIEW';
    // Weight this member can still cast: their own ready units plus the ones
    // they hold as a proxy.
    const votableWeights: Rational[] = [];
    const owningUnits: VoterStatusResponseDto['owningUnits'] = [];

    for (const unitId of unitIds) {
      const info = unitInfo.get(unitId);
      if (!info) continue;

      const isOwner = ownedUnitIds.has(unitId);
      const resolved = resolvedByUnit.get(unitId);

      if (!resolved) {
        // Should not happen with a complete snapshot; report an owned unit
        // rather than dropping it, but never invent a row for someone else's.
        if (isOwner) {
          owningUnits.push({
            id: unitId,
            name: info.name,
            share: info.share,
            status: OwningUnitStatus.INELIGIBLE,
          });
        }
        continue;
      }

      // A consent does not always make its delegate the representative — a
      // co-owner's share majority outweighs it. Units this member neither
      // owns nor ended up representing are not theirs to see.
      if (!isOwner && resolved.channelMembershipId !== membershipId) {
        continue;
      }

      const status = deriveOwningUnitStatus({
        resolved,
        channelMembershipId: resolved.channelMembershipId,
        membershipId,
        isOwner,
        hasVoted: votedUnits.has(unitId),
        phase,
      });

      if (
        status === OwningUnitStatus.READY ||
        status === OwningUnitStatus.PROXY
      ) {
        votableWeights.push(
          Rational.from(resolved.weightNum, resolved.weightDen),
        );
      }

      owningUnits.push({
        id: unitId,
        name: info.name,
        share: info.share,
        status,
        ineligibleReason: resolved.ineligibleReason,
      });
    }

    return {
      canVote: votableWeights.length > 0,
      totalVotingPower: {
        value: Rational.sum(votableWeights).toDecimalString(4),
        maximum: totalMaximum.toDecimalString(4),
      },
      owningUnits,
    };
  }

  /** Exact sum of every unit's building share in the tenant. */
  private async getTenantTotalShare(tenantId: string): Promise<Rational> {
    const allUnits = await this.drizzle.db
      .select({
        buildingShareNumerator: units.buildingShareNumerator,
        buildingShareDenominator: units.buildingShareDenominator,
      })
      .from(units)
      .where(eq(units.tenantId, tenantId));

    return Rational.sum(
      allUnits.map((u) =>
        Rational.from(u.buildingShareNumerator, u.buildingShareDenominator),
      ),
    );
  }

  async findVoterSummariesForVotes(
    tenantId: string,
    voteIds: string[],
    membershipId: string,
    now: Date,
  ): Promise<Map<string, VoterSummaryDto>> {
    const result = new Map<string, VoterSummaryDto>();
    if (voteIds.length === 0) return result;

    const noVoteSummary: VoterSummaryDto = {
      canVote: false,
      requiresDelegation: false,
      isDelegated: false,
      hasVoted: false,
    };

    const voteStatuses = await this.drizzle.db
      .select({ id: votes.id, status: votes.status })
      .from(votes)
      .where(inArray(votes.id, voteIds));

    const voteStatusMap = new Map(voteStatuses.map((v) => [v.id, v.status]));
    const isSnapshotVote = (voteId: string) => {
      const status = voteStatusMap.get(voteId);
      return status === 'OPEN' || status === 'CLOSED';
    };

    const ownerId = await this.resolveOwnerId(tenantId, membershipId);
    const ownedUnitIds = new Set(
      ownerId ? await this.findOwnedUnitIds(tenantId, ownerId, now) : [],
    );

    // Same union as `findVoterStatus`: a member with no units of their own
    // still has something to do on a vote they were chosen to represent for.
    const representedByVote = await this.findRepresentedUnitIdsByVote(
      tenantId,
      membershipId,
      voteIds.filter(isSnapshotVote),
      voteIds.filter((id) => !isSnapshotVote(id)),
    );

    const allUnitIds = [
      ...new Set([
        ...ownedUnitIds,
        ...[...representedByVote.values()].flatMap((units) => [...units]),
      ]),
    ];

    if (allUnitIds.length === 0) {
      for (const id of voteIds) result.set(id, noVoteSummary);
      return result;
    }

    // Units and their ownership parties do not vary per vote — load once for
    // every unit in play, and only if a vote still needs a live preview.
    let ownershipPlan:
      | { units: ElectorateUnitInput[]; parties: ElectoratePartyInput[] }
      | undefined;

    for (const voteId of voteIds) {
      const unitIds = [
        ...new Set([
          ...ownedUnitIds,
          ...(representedByVote.get(voteId) ?? new Set<string>()),
        ]),
      ];

      if (unitIds.length === 0) {
        result.set(voteId, noVoteSummary);
        continue;
      }

      if (isSnapshotVote(voteId)) {
        const snapshotRows = await this.drizzle.db
          .select({
            unitId: voteElectorateUnits.unitId,
            channelMembershipId: channelMembershipIdSql(),
            eligibilityStatus: voteElectorateUnits.eligibilityStatus,
          })
          .from(voteElectorateUnits)
          .where(
            and(
              eq(voteElectorateUnits.tenantId, tenantId),
              eq(voteElectorateUnits.voteId, voteId),
              inArray(voteElectorateUnits.unitId, unitIds),
            ),
          );

        let canVote = false;
        let isDelegated = false;

        for (const row of snapshotRows) {
          if (row.eligibilityStatus !== ElectorateEligibilityStatus.ELIGIBLE) {
            continue;
          }
          if (row.channelMembershipId === membershipId) {
            canVote = true;
          } else if (ownedUnitIds.has(row.unitId)) {
            // Only a unit of their own can be one they handed to someone else.
            isDelegated = true;
          }
        }

        const votedUnits = await this.getVotedUnits(tenantId, voteId, unitIds);

        result.set(voteId, {
          canVote,
          isDelegated: !canVote && isDelegated,
          hasVoted: votedUnits.size > 0,
        });
        continue;
      }

      ownershipPlan ??= await this.loadOwnershipPlan(tenantId, allUnitIds, now);
      const [preview, votedUnits] = await Promise.all([
        this.previewElectorate(
          tenantId,
          voteId,
          allUnitIds,
          now,
          ownershipPlan,
        ),
        this.getVotedUnits(tenantId, voteId, unitIds),
      ]);

      let hasVotable = false;
      let hasRequiresDelegation = false;
      let hasDelegated = false;

      for (const resolved of preview) {
        const isOwner = ownedUnitIds.has(resolved.unitId);
        // The plan spans every vote's units; skip the ones this member
        // neither owns nor ended up representing here.
        if (!isOwner && resolved.channelMembershipId !== membershipId) {
          continue;
        }

        // `hasVoted` is reported separately, so a cast ballot must not hide
        // that this membership represents the unit.
        switch (
          deriveOwningUnitStatus({
            resolved,
            channelMembershipId: resolved.channelMembershipId,
            membershipId,
            isOwner,
            hasVoted: false,
            phase: 'PREVIEW',
          })
        ) {
          case OwningUnitStatus.READY:
          case OwningUnitStatus.PROXY:
            hasVotable = true;
            break;
          case OwningUnitStatus.REQUIRES_DELEGATION:
            hasRequiresDelegation = true;
            break;
          case OwningUnitStatus.DELEGATED:
            hasDelegated = true;
            break;
          default:
            break;
        }
      }

      result.set(voteId, {
        canVote: hasVotable,
        requiresDelegation: hasRequiresDelegation,
        isDelegated: hasDelegated,
        hasVoted: votedUnits.size > 0,
      });
    }

    return result;
  }

  async findDelegationCandidates(
    tenantId: string,
    voteId: string,
    unitId: string,
    exclude: { membershipId?: string; ownerId?: string },
    requesterMembershipId: string,
    now: Date,
  ): Promise<DelegationCandidateDto[]> {
    // A representative is a person, not an account: every owner of the tenant
    // (the association aside) plus every active member who owns nothing here.
    const ownerRows = await this.drizzle.db
      .select({
        ownerId: owners.id,
        membershipId: tenantMemberships.id,
        name: owners.displayName,
      })
      .from(owners)
      .leftJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.userId, owners.userId),
          eq(tenantMemberships.tenantId, owners.tenantId),
          eq(tenantMemberships.status, 'ACTIVE'),
        ),
      )
      .where(
        and(
          eq(owners.tenantId, tenantId),
          ne(owners.kind, OwnerKind.ASSOCIATION),
        ),
      );

    const memberOnlyRows = await this.drizzle.db
      .select({ membershipId: tenantMemberships.id, name: users.fullName })
      .from(tenantMemberships)
      .innerJoin(users, eq(users.id, tenantMemberships.userId))
      // A user linked to the association's own owner row is a member, not an owner.
      .leftJoin(
        owners,
        and(
          eq(owners.userId, tenantMemberships.userId),
          eq(owners.tenantId, tenantMemberships.tenantId),
          ne(owners.kind, OwnerKind.ASSOCIATION),
        ),
      )
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.status, 'ACTIVE'),
          isNull(owners.id),
        ),
      );

    const unitOwnerIds = new Set(
      (
        await this.drizzle.db
          .select({ ownerId: unitOwnershipMembers.ownerId })
          .from(unitOwnerships)
          .innerJoin(
            unitOwnershipMembers,
            eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
          )
          .where(
            and(
              eq(unitOwnerships.tenantId, tenantId),
              eq(unitOwnerships.unitId, unitId),
              ownershipActiveAt(now),
            ),
          )
      ).map((r) => r.ownerId),
    );

    const consentRows = await this.drizzle.db
      .select({
        fromOwnerId: voteUnitConsents.fromOwnerId,
        toOwnerId: voteUnitConsents.toOwnerId,
        toMembershipId: voteUnitConsents.toMembershipId,
      })
      .from(voteUnitConsents)
      .where(
        and(
          eq(voteUnitConsents.tenantId, tenantId),
          eq(voteUnitConsents.voteId, voteId),
          eq(voteUnitConsents.unitId, unitId),
          eq(voteUnitConsents.status, VoteUnitConsentStatus.VALID),
        ),
      );
    const grantorsWithConsent = new Set(consentRows.map((c) => c.fromOwnerId));
    const requesterOwnerId = await this.resolveOwnerId(
      tenantId,
      requesterMembershipId,
    );
    const delegatedToRequester = new Set(
      consentRows
        .filter(
          (c) =>
            c.toMembershipId === requesterMembershipId ||
            (requesterOwnerId !== null && c.toOwnerId === requesterOwnerId),
        )
        .map((c) => c.fromOwnerId),
    );

    const excludedOwnerId =
      exclude.ownerId ??
      (exclude.membershipId
        ? await this.resolveOwnerId(tenantId, exclude.membershipId)
        : null);

    const candidates: DelegationCandidateDto[] = [
      ...ownerRows
        .filter(
          (r) =>
            r.ownerId !== excludedOwnerId &&
            r.membershipId !== exclude.membershipId,
        )
        .map((r) => ({
          ownerId: r.ownerId,
          membershipId: r.membershipId,
          name: r.name,
          hasAccount: r.membershipId !== null,
          isUnitOwner: unitOwnerIds.has(r.ownerId),
          // A person who handed their own vote for this unit to someone else
          // cannot be the one to hold it.
          isEligible: !grantorsWithConsent.has(r.ownerId),
          hasDelegatedToRequester: delegatedToRequester.has(r.ownerId),
        })),
      ...memberOnlyRows
        .filter((r) => r.membershipId !== exclude.membershipId)
        .map((r) => ({
          ownerId: null,
          membershipId: r.membershipId,
          name: r.name,
          hasAccount: true,
          isUnitOwner: false,
          isEligible: true,
          hasDelegatedToRequester: false,
        })),
    ];

    return candidates.sort(
      (a, b) =>
        Number(b.isUnitOwner) - Number(a.isUnitOwner) ||
        a.name.localeCompare(b.name, 'cs'),
    );
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
      whereClause = and(
        whereClause,
        ownerId
          ? or(
              eq(voteUnitConsents.fromOwnerId, ownerId),
              eq(voteUnitConsents.toOwnerId, ownerId),
              eq(voteUnitConsents.toMembershipId, membershipId),
            )
          : eq(voteUnitConsents.toMembershipId, membershipId),
      );
    }

    const targetOwners = alias(owners, 'target_owners');
    const targetOwnerMemberships = alias(
      tenantMemberships,
      'target_owner_memberships',
    );
    const targetMemberships = alias(tenantMemberships, 'target_memberships');
    const targetMemberOwners = alias(owners, 'target_member_owners');

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
        toOwnerId: voteUnitConsents.toOwnerId,
        toMembershipId: voteUnitConsents.toMembershipId,
        targetOwnerName: targetOwners.displayName,
        targetOwnerMembershipId: targetOwnerMemberships.id,
        targetMemberOwnerName: targetMemberOwners.displayName,
        targetMemberName: users.fullName,
        recordedByMembershipId: voteUnitConsents.recordedByMembershipId,
        createdAt: voteUnitConsents.createdAt,
      })
      .from(voteUnitConsents)
      .innerJoin(votes, eq(voteUnitConsents.voteId, votes.id))
      .innerJoin(units, eq(voteUnitConsents.unitId, units.id))
      .innerJoin(owners, eq(voteUnitConsents.fromOwnerId, owners.id))
      .leftJoin(targetOwners, eq(voteUnitConsents.toOwnerId, targetOwners.id))
      .leftJoin(
        targetOwnerMemberships,
        and(
          eq(targetOwnerMemberships.userId, targetOwners.userId),
          eq(targetOwnerMemberships.tenantId, targetOwners.tenantId),
          eq(targetOwnerMemberships.status, 'ACTIVE'),
        ),
      )
      .leftJoin(
        targetMemberships,
        eq(voteUnitConsents.toMembershipId, targetMemberships.id),
      )
      .leftJoin(users, eq(users.id, targetMemberships.userId))
      .leftJoin(
        targetMemberOwners,
        and(
          eq(targetMemberOwners.userId, targetMemberships.userId),
          eq(targetMemberOwners.tenantId, targetMemberships.tenantId),
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
      toOwnerId: r.toOwnerId,
      toMembershipId: r.toMembershipId,
      toDelegateName:
        r.targetOwnerName ??
        r.targetMemberOwnerName ??
        r.targetMemberName ??
        '',
      toDelegateHasAccount:
        r.toMembershipId !== null || r.targetOwnerMembershipId !== null,
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

  async isActiveUnitOwner(
    tenantId: string,
    unitId: string,
    ownerId: string,
    now: Date,
  ): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: unitOwnershipMembers.id })
      .from(unitOwnershipMembers)
      .innerJoin(
        unitOwnerships,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          eq(unitOwnerships.unitId, unitId),
          eq(unitOwnershipMembers.ownerId, ownerId),
          ownershipActiveAt(now),
          ne(owners.kind, OwnerKind.ASSOCIATION),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async isDelegableOwner(tenantId: string, ownerId: string): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: owners.id })
      .from(owners)
      .where(
        and(
          eq(owners.tenantId, tenantId),
          eq(owners.id, ownerId),
          ne(owners.kind, OwnerKind.ASSOCIATION),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async isActiveMembership(
    tenantId: string,
    membershipId: string,
  ): Promise<boolean> {
    const rows = await this.drizzle.db
      .select({ id: tenantMemberships.id })
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.id, membershipId),
          eq(tenantMemberships.status, 'ACTIVE'),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async getMembershipByOwnerId(
    tenantId: string,
    ownerId: string,
  ): Promise<string | null> {
    const rows = await this.drizzle.db
      .select({ id: tenantMemberships.id })
      .from(owners)
      .innerJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.userId, owners.userId),
          eq(tenantMemberships.tenantId, owners.tenantId),
        ),
      )
      .where(and(eq(owners.tenantId, tenantId), eq(owners.id, ownerId)))
      .limit(1);

    return rows.length > 0 ? rows[0].id : null;
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

  async findResultsByVoteId(
    tenantId: string,
    voteId: string,
  ): Promise<VoteResultsResponseDto | null> {
    const resultRows = await this.drizzle.db
      .select()
      .from(voteResults)
      .where(
        and(eq(voteResults.tenantId, tenantId), eq(voteResults.voteId, voteId)),
      )
      .limit(1);

    if (resultRows.length === 0) return null;

    const result = resultRows[0];

    const questionResultRows = await this.drizzle.db
      .select()
      .from(voteQuestionResults)
      .where(eq(voteQuestionResults.voteResultId, result.id));

    const questionResultIds = questionResultRows.map((qr) => qr.id);
    const optionResultRows =
      questionResultIds.length > 0
        ? await this.drizzle.db
            .select()
            .from(voteOptionResults)
            .where(
              inArray(voteOptionResults.questionResultId, questionResultIds),
            )
        : [];

    const questionResults = questionResultRows.map((qr) => {
      const denominator = Rational.from(
        qr.majorityDenominatorNum,
        qr.majorityDenominatorDen,
      );
      return {
        questionId: qr.questionId,
        majorityMet: qr.majorityMet,
        winningOptionId: qr.winningOptionId ?? null,
        majorityThreshold: {
          num: qr.majorityThresholdNum,
          den: qr.majorityThresholdDen,
        },
        majorityComparator: qr.majorityComparator as ThresholdComparator,
        majorityDenominator: toFractionDto(denominator),
        optionResults: optionResultRows
          .filter((or) => or.questionResultId === qr.id)
          .map((or) => {
            const weight = Rational.from(or.voteWeightNum, or.voteWeightDen);
            return {
              optionId: or.optionId,
              voteWeight: toFractionDto(weight),
              percent: toPercentString(weight, denominator),
              voteUnitCount: or.voteUnitCount,
            };
          }),
      };
    });

    const participationWeight = Rational.from(
      result.participationWeightNum,
      result.participationWeightDen,
    );
    const totalVotesWeight = Rational.from(
      result.totalVotesWeightNum,
      result.totalVotesWeightDen,
    );

    return {
      resultStatus: result.resultStatus as 'COMPUTED' | 'FAILED',
      quorumMet: result.quorumMet,
      participationWeight: toFractionDto(participationWeight),
      participationPercent: toPercentString(
        participationWeight,
        totalVotesWeight,
      ),
      participationUnitCount: result.participationUnitCount,
      totalVotesWeight: toFractionDto(totalVotesWeight),
      totalVotesUnitCount: result.totalVotesUnitCount,
      computedAt: result.computedAt,
      questionResults,
    };
  }

  async findQuestionOutcomesForVotes(
    tenantId: string,
    voteIds: string[],
  ): Promise<Map<string, QuestionOutcomeDto[]>> {
    if (voteIds.length === 0) {
      return new Map();
    }

    const rows = await this.drizzle.db
      .select({
        voteId: voteResults.voteId,
        quorumMet: voteResults.quorumMet,
        questionId: voteQuestionResults.questionId,
        majorityMet: voteQuestionResults.majorityMet,
        title: voteQuestions.title,
        sortOrder: voteQuestions.sortOrder,
        questionType: voteQuestions.questionType,
        winningOptionKey: voteOptions.optionKey,
        winningOptionLabel: voteOptions.label,
      })
      .from(voteResults)
      .innerJoin(
        voteQuestionResults,
        and(
          eq(voteQuestionResults.voteResultId, voteResults.id),
          eq(voteQuestionResults.tenantId, tenantId),
        ),
      )
      .innerJoin(
        voteQuestions,
        and(
          eq(voteQuestions.id, voteQuestionResults.questionId),
          eq(voteQuestions.tenantId, tenantId),
        ),
      )
      .leftJoin(
        voteOptions,
        eq(voteOptions.id, voteQuestionResults.winningOptionId),
      )
      .where(
        and(
          eq(voteResults.tenantId, tenantId),
          inArray(voteResults.voteId, voteIds),
          eq(voteResults.resultStatus, 'COMPUTED'),
        ),
      )
      .orderBy(voteQuestions.sortOrder);

    const outcomesByVote = new Map<string, QuestionOutcomeDto[]>();
    for (const row of rows) {
      const outcome = deriveQuestionOutcome({
        questionType: row.questionType as VoteQuestionType,
        quorumMet: row.quorumMet,
        majorityMet: row.majorityMet,
        winningOptionKey: row.winningOptionKey,
      });
      const list = outcomesByVote.get(row.voteId) ?? [];
      list.push({
        questionId: row.questionId,
        title: row.title,
        outcome,
        winningOptionLabel: row.winningOptionLabel ?? null,
      });
      outcomesByVote.set(row.voteId, list);
    }
    return outcomesByVote;
  }

  async findParticipation(
    tenantId: string,
    voteId: string,
    requesterMembershipId: string,
    now: Date,
  ): Promise<VoteParticipationUnitDto[]> {
    const snapshotRows = await this.drizzle.db
      .select({
        unitId: voteElectorateUnits.unitId,
        unitNo: units.unitNo,
        buildingShareNumerator: units.buildingShareNumerator,
        buildingShareDenominator: units.buildingShareDenominator,
        representativeOwnerId: voteElectorateUnits.representativeOwnerId,
        representativeMembershipId:
          voteElectorateUnits.representativeMembershipId,
        channelMembershipId: channelMembershipIdSql(),
        eligibilityStatus: voteElectorateUnits.eligibilityStatus,
        ineligibleReason: voteElectorateUnits.ineligibleReason,
      })
      .from(voteElectorateUnits)
      .innerJoin(units, eq(units.id, voteElectorateUnits.unitId))
      .where(
        and(
          eq(voteElectorateUnits.tenantId, tenantId),
          eq(voteElectorateUnits.voteId, voteId),
        ),
      )
      .orderBy(units.unitNo);

    if (snapshotRows.length === 0) return [];

    const unitIds = snapshotRows.map((row) => row.unitId);

    const ballotRows = await this.drizzle.db
      .select({
        ballotId: ballots.id,
        unitId: ballots.unitId,
        castMethod: ballots.castMethod,
        castAt: ballots.castAt,
        recordedBy: users.fullName,
      })
      .from(ballots)
      .leftJoin(
        tenantMemberships,
        eq(tenantMemberships.id, ballots.castByMembershipId),
      )
      .leftJoin(users, eq(users.id, tenantMemberships.userId))
      .where(and(eq(ballots.tenantId, tenantId), eq(ballots.voteId, voteId)));
    const ballotByUnit = new Map(ballotRows.map((row) => [row.unitId, row]));

    const ballotIds = ballotRows.map((row) => row.ballotId);
    const answerRows =
      ballotIds.length === 0
        ? []
        : await this.drizzle.db
            .select({
              ballotId: ballotAnswers.ballotId,
              questionId: ballotAnswers.questionId,
              optionId: ballotAnswers.optionId,
              optionLabel: voteOptions.label,
              optionKey: voteOptions.optionKey,
            })
            .from(ballotAnswers)
            .innerJoin(voteOptions, eq(voteOptions.id, ballotAnswers.optionId))
            .where(inArray(ballotAnswers.ballotId, ballotIds));

    const answersByBallot = new Map<string, ParticipationAnswerDto[]>();
    for (const row of answerRows) {
      const list = answersByBallot.get(row.ballotId) ?? [];
      list.push({
        questionId: row.questionId,
        optionId: row.optionId,
        optionLabel: row.optionLabel,
        optionKey: row.optionKey as VoteOptionSemantic,
      });
      answersByBallot.set(row.ballotId, list);
    }

    const ownerRows = await this.drizzle.db
      .select({
        unitId: unitOwnerships.unitId,
        ownerId: owners.id,
        displayName: owners.displayName,
        shareNumerator: unitOwnerships.shareNumerator,
        shareDenominator: unitOwnerships.shareDenominator,
        membershipId: tenantMemberships.id,
      })
      .from(unitOwnerships)
      .innerJoin(
        unitOwnershipMembers,
        eq(unitOwnershipMembers.ownershipId, unitOwnerships.id),
      )
      .innerJoin(owners, eq(unitOwnershipMembers.ownerId, owners.id))
      .leftJoin(
        tenantMemberships,
        and(
          eq(tenantMemberships.userId, owners.userId),
          eq(tenantMemberships.tenantId, owners.tenantId),
        ),
      )
      .where(
        and(
          eq(unitOwnerships.tenantId, tenantId),
          inArray(unitOwnerships.unitId, unitIds),
          ownershipActiveAt(now),
        ),
      );

    const ownersByUnit = new Map<string, typeof ownerRows>();
    for (const row of ownerRows) {
      const list = ownersByUnit.get(row.unitId) ?? [];
      list.push(row);
      ownersByUnit.set(row.unitId, list);
    }

    // A representative need not own the unit — a designated outsider, or an
    // owner of another unit — so their name may be missing from `ownerRows`.
    const ownerNamesById = new Map(
      ownerRows.map((o) => [o.ownerId, o.displayName]),
    );
    const missingOwnerIds = [
      ...new Set(
        snapshotRows.flatMap((r) =>
          r.representativeOwnerId &&
          !ownerNamesById.has(r.representativeOwnerId)
            ? [r.representativeOwnerId]
            : [],
        ),
      ),
    ];
    if (missingOwnerIds.length > 0) {
      const extra = await this.drizzle.db
        .select({ id: owners.id, displayName: owners.displayName })
        .from(owners)
        .where(
          and(
            eq(owners.tenantId, tenantId),
            inArray(owners.id, missingOwnerIds),
          ),
        );
      for (const o of extra) ownerNamesById.set(o.id, o.displayName);
    }
    const memberIds = [
      ...new Set(
        snapshotRows.flatMap((r) =>
          r.representativeMembershipId ? [r.representativeMembershipId] : [],
        ),
      ),
    ];
    const memberNamesById = new Map<string, string>();
    if (memberIds.length > 0) {
      const memberRows = await this.drizzle.db
        .select({ id: tenantMemberships.id, name: users.fullName })
        .from(tenantMemberships)
        .innerJoin(users, eq(users.id, tenantMemberships.userId))
        .where(inArray(tenantMemberships.id, memberIds));
      for (const m of memberRows) memberNamesById.set(m.id, m.name);
    }

    return snapshotRows.map((row) => {
      const ballot = ballotByUnit.get(row.unitId);
      const owners = ownersByUnit.get(row.unitId) ?? [];
      // Ownership, not representation: a co-owner who is not the common
      // representative still owns the unit, and a proxy delegate does not.
      const ownsUnit = owners.some(
        (o) =>
          o.membershipId != null && o.membershipId === requesterMembershipId,
      );
      const representsUnit = row.channelMembershipId === requesterMembershipId;
      // Rows written before `representative_owner_id` existed name the
      // representative by membership alone, and that is usually a co-owner's
      // account. Falling back to it keeps the owner marker on those units.
      const legacyOwnerRepresentative = row.representativeOwnerId
        ? undefined
        : owners.find(
            (o) =>
              o.membershipId != null &&
              o.membershipId === row.representativeMembershipId,
          );

      const status = ballot
        ? 'VOTED'
        : row.eligibilityStatus === 'ELIGIBLE'
          ? 'NOT_VOTED'
          : ('INELIGIBLE' as VoteParticipationUnitDto['status']);

      return {
        unitId: row.unitId,
        unitNo: row.unitNo,
        ownerNames: owners.map((o) => o.displayName),
        share: `${row.buildingShareNumerator}/${row.buildingShareDenominator}`,
        status,
        castMethod: ballot?.castMethod,
        castAt: ballot?.castAt,
        // Every ballot has a castByMembershipId, including DIRECT ones (it's
        // the voter's own membership) — only surface it as "recorded by"
        // when a paper ballot was actually recorded on someone's behalf.
        recordedBy:
          ballot?.castMethod === 'BOARD_PROXY'
            ? ballot.recordedBy ?? undefined
            : undefined,
        answers: ballot
          ? answersByBallot.get(ballot.ballotId) ?? []
          : undefined,
        ineligibleReason:
          status === 'INELIGIBLE'
            ? row.ineligibleReason ?? undefined
            : undefined,
        isOwnUnit: representsUnit,
        ownsUnit,
        isProxy: representsUnit && !ownsUnit,
        canVoteInApp: row.channelMembershipId !== null,
        representative: row.representativeOwnerId
          ? {
              ownerId: row.representativeOwnerId,
              membershipId: null,
              name: ownerNamesById.get(row.representativeOwnerId) ?? '',
              isUnitOwner: owners.some(
                (o) => o.ownerId === row.representativeOwnerId,
              ),
            }
          : row.representativeMembershipId
            ? {
                ownerId: null,
                membershipId: row.representativeMembershipId,
                name:
                  legacyOwnerRepresentative?.displayName ??
                  memberNamesById.get(row.representativeMembershipId) ??
                  '',
                isUnitOwner: legacyOwnerRepresentative != null,
              }
            : null,
        owners: owners.map((o) => ({
          ownerId: o.ownerId,
          displayName: o.displayName,
          share: `${o.shareNumerator}/${o.shareDenominator}`,
          isRepresentative: row.representativeOwnerId
            ? o.ownerId === row.representativeOwnerId
            : o.membershipId != null &&
              o.membershipId === row.representativeMembershipId,
        })),
      };
    });
  }
}
