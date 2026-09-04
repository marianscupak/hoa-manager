export class CancelScheduledOwnershipTransferCommand {
  constructor(
    public readonly tenantId: string,
    public readonly unitId: string,
  ) {}
}
