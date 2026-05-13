import { VoteResultSnapshot } from '@/modules/voting/domain/vote/vote-result.types';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { ElectorateUnit } from '@/modules/voting/domain/vote/vote.types';

export interface BallotInput {
  unitId: string;
  castByMembershipId: string;
  castMethod: 'DIRECT' | 'BOARD_PROXY';
  answers: { questionId: string; optionId: string }[];
}

export interface VoteWriteRepository {
  findById(tenantId: string, id: string): Promise<VoteAggregate | null>;
  save(vote: VoteAggregate): Promise<void>;
  saveElectorateUnits(
    tenantId: string,
    voteId: string,
    units: ElectorateUnit[],
  ): Promise<void>;
  findScheduledToOpen(now: Date): Promise<VoteAggregate[]>;
  saveBallots(
    tenantId: string,
    voteId: string,
    ballots: BallotInput[],
  ): Promise<{ ballotId: string; unitId: string }[]>;
  findElectorateUnitsForMembership(
    tenantId: string,
    voteId: string,
    membershipId: string,
    unitIds: string[],
  ): Promise<{ unitId: string; representativeMembershipId: string | null }[]>;
  hasExistingBallots(
    tenantId: string,
    voteId: string,
    unitIds: string[],
    castByMembershipId?: string,
  ): Promise<Set<string>>;
  findScheduledToClose(now: Date): Promise<VoteAggregate[]>;
  saveResults(
    tenantId: string,
    voteId: string,
    snapshot: VoteResultSnapshot,
  ): Promise<void>;
}

export const VOTE_WRITE_REPOSITORY = Symbol('VOTE_WRITE_REPOSITORY');
