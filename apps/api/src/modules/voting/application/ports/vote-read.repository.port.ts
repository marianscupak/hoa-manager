import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoterStatusResponseDto,
  type VoterSummaryDto,
  type DelegationCandidateDto,
  type VoteConsentResponseDto,
  type VoteResultsResponseDto,
  type QuestionOutcomeDto,
} from '@/modules/voting/api/dto/vote.dto';
import { VoteStatus } from '@/modules/voting/domain/vote/vote.types';

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
   * unit's ownership party — used to validate a POA grantor supplied
   * directly by an admin/board member, who may have no user account.
   */
  isActiveUnitOwner(
    tenantId: string,
    unitId: string,
    ownerId: string,
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
  ): Promise<VoterStatusResponseDto>;
  findVoterSummariesForVotes(
    tenantId: string,
    voteIds: string[],
    membershipId: string,
  ): Promise<Map<string, VoterSummaryDto>>;
  findDelegationCandidates(
    tenantId: string,
    voteId: string,
    unitId: string,
    forMembershipId: string | undefined,
    requesterMembershipId: string,
  ): Promise<DelegationCandidateDto[]>;
  findResultsByVoteId(
    tenantId: string,
    voteId: string,
  ): Promise<VoteResultsResponseDto | null>;
  findQuestionOutcomesForVotes(
    tenantId: string,
    voteIds: string[],
  ): Promise<Map<string, QuestionOutcomeDto[]>>;
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
