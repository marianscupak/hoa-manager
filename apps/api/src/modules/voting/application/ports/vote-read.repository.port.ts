import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
  type VoterStatusResponseDto,
  type VoterSummaryDto,
  type DelegationCandidateDto,
} from '@/modules/voting/api/dto/vote.dto';
import { type VoteStatus } from '@/modules/voting/domain/vote/vote.types';

export interface VoteReadRepository {
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
    requesterMembershipId: string,
  ): Promise<DelegationCandidateDto[]>;
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
