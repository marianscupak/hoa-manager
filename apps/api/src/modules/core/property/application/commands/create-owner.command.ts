import { OwnerKind } from '@/modules/core/property/domain/ownership-plan';

export class CreateOwnerCommand {
  constructor(
    public readonly tenantId: string,
    public readonly displayName: string,
    public readonly userId: string | null = null,
    public readonly email: string | null = null,
    public readonly executorId: string | null = null,
    public readonly kind: OwnerKind = OwnerKind.PERSON,
  ) {}
}
