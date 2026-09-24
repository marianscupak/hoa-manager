import type { VoteInRange } from '@/modules/core/property/domain/ownership-period-bounds';

/**
 * Reads the votes a unit has taken part in, so moving an ownership period can
 * say what it reaches. Declared by the register and implemented by the voting
 * module (VotingPortsModule), so the register never touches voting's tables
 * and core does not depend on voting.
 */
export interface OwnershipVoteLookup {
  /**
   * Every vote of the association. Not narrowed by unit on purpose: the
   * electorate spans the whole building, so each unit takes part in each
   * vote and narrowing would only hide the ones that matter.
   */
  findVotes(tenantId: string): Promise<VoteInRange[]>;
}

export const OWNERSHIP_VOTE_LOOKUP = Symbol('OWNERSHIP_VOTE_LOOKUP');
