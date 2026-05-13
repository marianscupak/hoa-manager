import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoterStatusResponseDto,
  type VoterSummaryDto,
  type DelegationCandidateDto,
  type VoteConsentResponseDto,
  type VoteResultsResponseDto,
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
  getMembershipByOwnerId(
    tenantId: string,
    ownerId: string,
  ): Promise<string | null>;
  hasMutualDelegation(
    tenantId: string,
    unitId: string,
    voteId: string,
    delegatorMembershipId: string,
    delegateMembershipId: string,
  ): Promise<boolean>;
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
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
