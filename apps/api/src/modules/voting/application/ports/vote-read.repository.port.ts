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
    forMembershipId: string | undefined,
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
   */
  findParticipation(
    tenantId: string,
    voteId: string,
    requesterMembershipId: string,
    now: Date,
  ): Promise<VoteParticipationUnitDto[]>;
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
