import { VoteUnitConsentStatus } from '@/modules/voting/domain/vote/vote.types';

export type SaveVoteUnitConsentInput = {
  tenantId: string;
  voteId: string;
  unitId: string;
  fromOwnerId: string;
  toMembershipId: string;
  recordedByMembershipId: string | null;
  status: VoteUnitConsentStatus;
};

export interface VoteConsentWriteRepository {
  /**
   * Saves or updates a consent record for a specific unit and vote.
   * Identifies the record by tenantId, voteId, unitId, and fromOwnerId.
   */
  save(data: SaveVoteUnitConsentInput): Promise<void>;
}

export const VOTE_CONSENT_WRITE_REPOSITORY = Symbol(
  'VOTE_CONSENT_WRITE_REPOSITORY',
);
