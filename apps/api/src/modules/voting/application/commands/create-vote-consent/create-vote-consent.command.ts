import type { ConsentTargetInput } from './consent-target-input';

export type { ConsentTargetInput } from './consent-target-input';

export class CreateVoteConsentCommand {
  constructor(
    public readonly tenantId: string,
    public readonly voteId: string,
    public readonly unitId: string,
    public readonly membershipId: string,
    public readonly target: ConsentTargetInput,
    public readonly roles: string[],
    public readonly fromOwnerId?: string,
  ) {}
}
