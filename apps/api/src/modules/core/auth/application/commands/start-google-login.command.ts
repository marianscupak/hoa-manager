export class StartGoogleLoginCommand {
  constructor(
    /**
     * Set when an account that is already signed in wants Google added to it.
     * The attempt is then marked `LINK` and may only ever attach an identity
     * to this user — never sign anyone in.
     */
    public readonly linkToUserId: string | null = null,
  ) {}
}
