export class ListPeopleQuery {
  constructor(
    readonly tenantId: string,
    /**
     * Whether the caller may see contact details and account state — ADMIN
     * and BOARD_MEMBER. Who owns which unit is public in the cadastre and is
     * returned either way.
     */
    readonly canSeeAccounts: boolean,
  ) {}
}
