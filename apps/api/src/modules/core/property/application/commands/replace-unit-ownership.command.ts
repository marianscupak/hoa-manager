import { OwnershipPartyInput } from '@/modules/core/property/domain/ownership-plan';

export class ReplaceUnitOwnershipCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly ownerships: OwnershipPartyInput[],
    /** Instant the new ownership takes effect (association-zone midnight). */
    public readonly effectiveAt: Date,
  ) {}
}
