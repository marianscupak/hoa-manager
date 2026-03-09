export class SwitchTenantCommand {
  constructor(
    public readonly targetTenantId: string,
    public readonly accessToken: string,
  ) {}
}

export interface SwitchTenantResult {
  accessToken: string;
}
