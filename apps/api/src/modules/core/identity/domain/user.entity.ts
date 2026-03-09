export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public fullName: string,
    public isEmailVerified: boolean,
    public isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static createNew(params: { email: string; fullName: string }): User {
    return new User(
      '',
      params.email,
      params.fullName,
      false,
      true,
      new Date(),
      new Date(),
    );
  }

  static rehydrate(raw: {
    id: string;
    email: string;
    fullName: string;
    isEmailVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      raw.id,
      raw.email,
      raw.fullName,
      raw.isEmailVerified,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}
