import { type ConsentTargetInput } from '../../commands/create-vote-consent/create-vote-consent.command';

export class PreviewConsentOutcomeQuery {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly unitId: string,
    public readonly target: ConsentTargetInput,
    public readonly membershipId: string,
  ) {}
}
