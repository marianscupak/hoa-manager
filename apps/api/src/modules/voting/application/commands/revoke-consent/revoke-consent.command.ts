export class RevokeConsentCommand {
  constructor(
    public readonly tenantId: string,
    public readonly consentId: string,
    public readonly roles: string[],
    public readonly membershipId: string,
  ) {}
}
