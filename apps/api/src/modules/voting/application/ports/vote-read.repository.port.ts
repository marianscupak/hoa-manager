import { type VoteDetailResponseDto } from '@/modules/voting/api/dto/vote.dto';

export interface VoteReadRepository {
  findDetailById(
    tenantId: string,
    id: string,
  ): Promise<VoteDetailResponseDto | null>;
}

export const VOTE_READ_REPOSITORY = Symbol('VOTE_READ_REPOSITORY');
