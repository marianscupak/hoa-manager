export class SetUserNameCommand {
  constructor(
    public readonly userId: string,
    public readonly fullName: string,
  ) {}
}
