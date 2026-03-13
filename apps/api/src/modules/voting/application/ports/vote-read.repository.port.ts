import {
  type VoteDetailResponseDto,
  type VoteListItemResponseDto,
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
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
