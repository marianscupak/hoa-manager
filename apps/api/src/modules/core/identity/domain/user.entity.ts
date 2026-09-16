export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public fullName: string,
    public isEmailVerified: boolean,
    public isActive: boolean,
    public preferredLanguage: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static createNew(params: {
    email: string;
    fullName: string;
    isEmailVerified?: boolean;
  }): User {
    return new User(
      '',
      params.email,
      params.fullName,
      params.isEmailVerified ?? false,
      true,
      'cs',
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
    preferredLanguage: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      raw.id,
      raw.email,
      raw.fullName,
      raw.isEmailVerified,
      raw.isActive,
      raw.preferredLanguage,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}
