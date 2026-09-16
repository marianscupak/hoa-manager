export interface AttendanceRow {
  unitId: string;
  status: 'PRESENT' | 'ABSENT';
  /** The entitled voter, when they are an owner on record. */
  voterOwnerId: string | null;
  /** A proxy holder who is not an owner — provenance only, never authority. */
  voterNote: string | null;
}

export interface VoteAttendanceRepository {
  upsert(
    tenantId: string,
    voteId: string,
    row: AttendanceRow & { recordedByMembershipId: string },
  ): Promise<void>;
  findByVote(tenantId: string, voteId: string): Promise<AttendanceRow[]>;
}

export const VOTE_ATTENDANCE_REPOSITORY = Symbol('VOTE_ATTENDANCE_REPOSITORY');
