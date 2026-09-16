export class SetUnitAttendanceCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly actorMembershipId: string,
    public readonly unitId: string,
    public readonly status: 'PRESENT' | 'ABSENT',
    public readonly voterOwnerId: string | null,
    public readonly voterNote: string | null,
  ) {}
}
