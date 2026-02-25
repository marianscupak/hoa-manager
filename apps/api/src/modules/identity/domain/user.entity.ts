export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly createdAt: Date,
  ) {}

  static createNew(params: { email: string }): User {
    return new User('', params.email, new Date());
  }

  static rehydrate(raw: { id: string; email: string; createdAt: Date }): User {
    return new User(raw.id, raw.email, raw.createdAt);
  }
}
