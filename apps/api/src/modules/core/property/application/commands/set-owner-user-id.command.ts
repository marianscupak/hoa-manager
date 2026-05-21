export type OwnerLinkSource = 'DIRECT' | 'INVITE_ACCEPT' | 'INVITE_REGISTER';

export class SetOwnerUserIdCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly userId: string,
    public readonly source: OwnerLinkSource,
  ) {}
}
