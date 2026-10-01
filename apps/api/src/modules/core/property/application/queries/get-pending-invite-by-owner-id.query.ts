export class GetPendingInviteByOwnerIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
  ) {}
}
