export class UpdateMembershipStatusCommand {
  constructor(
    public readonly membershipId: string,
    public readonly status: 'ACTIVE' | 'SUSPENDED' | 'INVITED',
  ) {}
}
