export class UpdateUserLanguageCommand {
  constructor(
    public readonly userId: string,
    public readonly language: string,
  ) {}
}
