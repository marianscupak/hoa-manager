import { VoteResultSnapshot } from '@/modules/voting/domain/vote/vote-result.types';
import { VoteAggregate } from '@/modules/voting/domain/vote/vote.aggregate';
import { ElectorateUnit } from '@/modules/voting/domain/vote/vote.types';

export interface BallotInput {
  unitId: string;
  castByMembershipId: string;
  castMethod: 'DIRECT' | 'BOARD_PROXY';
  /** The owner a BOARD_PROXY ballot is attributed to — the person who signed
   *  the paper. Null for DIRECT ballots. */
  attributionOwnerId?: string | null;
  attachmentDocumentId?: string | null;
  answers: { questionId: string; optionId: string }[];
}

export interface VoteWriteRepository {
  findById(tenantId: string, id: string): Promise<VoteAggregate | null>;
  save(vote: VoteAggregate): Promise<void>;
  delete(tenantId: string, voteId: string): Promise<void>;
  /**
   * Removes a unit's ballot and its answers.
   *
   * Only ever reached from the assembly recording flow, where flipping a unit
   * back to absent discards what was entered for it. A cast ballot stays final
   * everywhere else; the callers enforce that.
   */
  deleteBallotForUnit(
    tenantId: string,
    voteId: string,
    unitId: string,
  ): Promise<void>;
  /** Unit ids that already have a ballot recorded for this vote. */
  findUnitIdsWithBallot(tenantId: string, voteId: string): Promise<string[]>;
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
  ): Promise<Set<string>>;
  findElectorateUnit(
    tenantId: string,
    voteId: string,
    unitId: string,
  ): Promise<{
    unitId: string;
    representativeMembershipId: string | null;
    eligibilityStatus: string;
  } | null>;
  findScheduledToClose(now: Date): Promise<VoteAggregate[]>;
  saveResults(
    tenantId: string,
    voteId: string,
    snapshot: VoteResultSnapshot,
  ): Promise<void>;
}

export const VOTE_WRITE_REPOSITORY = Symbol('VOTE_WRITE_REPOSITORY');
