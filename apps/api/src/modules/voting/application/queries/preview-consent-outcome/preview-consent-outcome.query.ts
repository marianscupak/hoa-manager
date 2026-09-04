export class PreviewConsentOutcomeQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly unitId: string,
    public readonly delegateMembershipId: string,
    public readonly membershipId: string,
  ) {}
}
