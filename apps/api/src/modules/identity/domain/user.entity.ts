export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
  ) {}

  static createNew(params: { id: string; email: string }): User {
    const email = User.normalizeEmail(params.email);
    if (!email.includes('@')) throw new Error('Invalid email'); // pro začátek stačí

    return new User(params.id, email);
  }

  static rehydrate(raw: { id: string; email: string }): User {
    return new User(raw.id, User.normalizeEmail(raw.email));
  }

  static normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
