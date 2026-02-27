export class HandleGoogleCallbackCommand {
  constructor(
    public readonly code: string,
    public readonly state: string,
  ) {}
}
