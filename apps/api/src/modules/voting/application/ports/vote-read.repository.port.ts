import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoterStatusResponseDto,
  type VoterSummaryDto,
  type DelegationCandidateDto,
  type VoteConsentResponseDto,
  type VoteResultsResponseDto,
  type QuestionOutcomeDto,
  type VoteParticipationUnitDto,
} from '@/modules/voting/api/dto/vote.dto';
import type {
  ElectorateConsentInput,
  ElectoratePartyInput,
  ElectorateUnitInput,
} from '@/modules/voting/domain/vote/electorate-resolution';
import {
  VoteStatus,
  VoteWeightBasis,
} from '@/modules/voting/domain/vote/vote.types';

export interface VoteReadRepository {
  findConsents(
    tenantId: string,
    membershipId: string,
    isAdmin: boolean,
  ): Promise<VoteConsentResponseDto[]>;
  getOwnerIdByMembership(
    tenantId: string,
    membershipId: string,
  ): Promise<string | null>;
  /**
   * Whether `ownerId` is currently an active (non-association) member of a
   * unit's ownership party at `now` — used to validate a POA grantor
   * supplied directly by an admin/board member, who may have no user
   * account.
   */
  /**
   * Everything `resolveElectorateUnits` needs for the given units, so callers
   * can resolve hypothetical electorates (e.g. previewing a consent) with the
   * same inputs the real snapshot is built from.
   */
  loadElectorateInputs(
    tenantId: string,
    voteId: string,
    unitIds: string[],
    now: Date,
  ): Promise<{
    units: ElectorateUnitInput[];
    parties: ElectoratePartyInput[];
    consents: ElectorateConsentInput[];
    weightBasis: VoteWeightBasis;
  }>;
  isActiveUnitOwner(
    tenantId: string,
    unitId: string,
    ownerId: string,
    now: Date,
  ): Promise<boolean>;
  /** An owner in this tenant who can be named a representative: exists and
   *  is not the association itself. Having an account is not required. */
  isDelegableOwner(tenantId: string, ownerId: string): Promise<boolean>;
  isActiveMembership(tenantId: string, membershipId: string): Promise<boolean>;
  getMembershipByOwnerId(
    tenantId: string,
    ownerId: string,
  ): Promise<string | null>;
  isOwnerOfConsent(
    tenantId: string,
    consentId: string,
    membershipId: string,
  ): Promise<boolean>;
  findDetailById(
    tenantId: string,
    id: string,
  ): Promise<VoteDetailResponseDto | null>;
  findVotes(
    tenantId: string,
    statuses?: VoteStatus[],
  ): Promise<VoteListItemResponseDto[]>;
  findVoterStatus(
    tenantId: string,
    voteId: string,
    membershipId: string,
    now: Date,
  ): Promise<VoterStatusResponseDto>;
  findVoterSummariesForVotes(
    tenantId: string,
    voteIds: string[],
    membershipId: string,
    now: Date,
  ): Promise<Map<string, VoterSummaryDto>>;
  findDelegationCandidates(
    tenantId: string,
    voteId: string,
    unitId: string,
    exclude: { membershipId?: string; ownerId?: string },
    requesterMembershipId: string,
    now: Date,
  ): Promise<DelegationCandidateDto[]>;
  findResultsByVoteId(
    tenantId: string,
    voteId: string,
  ): Promise<VoteResultsResponseDto | null>;
  findQuestionOutcomesForVotes(
    tenantId: string,
    voteIds: string[],
  ): Promise<Map<string, QuestionOutcomeDto[]>>;
  /**
   * Every unit in the vote's frozen electorate snapshot, with its ballot
   * status and its current owners. Weights come from the snapshot; owner
   * names come from ownership current at `now`, because names are not
   * snapshotted.
   *
   * Always returns the **full** board-level shape. Redaction for unit
   * owners happens in `GetVoteParticipationHandler`, which is the single
   * place that decides what each role may see.
   */
  /**
   * Per-unit context the assembly recording screen needs on top of the live
   * electorate: display data and whatever the board has already entered.
   *
   * Separate from `findParticipation`, which reads the electorate snapshot —
   * an assembly record has none until it is published.
   */
  findAssemblyUnitContext(
    tenantId: string,
    voteId: string,
    now: Date,
  ): Promise<AssemblyUnitContext[]>;
  findParticipation(
    tenantId: string,
    voteId: string,
    requesterMembershipId: string,
    now: Date,
  ): Promise<VoteParticipationUnitDto[]>;
}

export interface AssemblyUnitContext {
  unitId: string;
  unitNo: string;
  owners: { ownerId: string; displayName: string }[];
  answers: { questionId: string; optionId: string }[];
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
