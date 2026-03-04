export class CreateOwnerCommand {
  constructor(
    public readonly tenantId: string,
    public readonly displayName: string,
    public readonly userId: string | null = null,
    public readonly email: string | null = null,
  ) {}
}
