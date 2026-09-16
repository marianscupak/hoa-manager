import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { MarkEmailVerifiedCommand } from '@/modules/core/identity/application/commands/mark-email-verified.command';
import { CreateUserHandler } from '@/modules/core/identity/application/handlers/create-user.handler';
import { MarkEmailVerifiedHandler } from '@/modules/core/identity/application/handlers/mark-email-verified.handler';
import type { UserRepository } from '@/modules/core/identity/application/ports/user.repository.port';
import { User } from '@/modules/core/identity/domain/user.entity';

function makeUserRepository(seed: User[] = []) {
  const users = new Map(seed.map((u) => [u.id, u]));
  const repo: UserRepository = {
    async findById(id) {
      return users.get(id) ?? null;
    },
    async findByEmail(email) {
      return [...users.values()].find((u) => u.email === email) ?? null;
    },
    async create(user) {
      const created = User.rehydrate({
        id: `user-${users.size + 1}`,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        preferredLanguage: user.preferredLanguage,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      users.set(created.id, created);
      return created;
    },
    async update(id, updates) {
      const user = users.get(id)!;
      Object.assign(user, updates);
      return user;
    },
  };
  return { repo, users };
}

function existingUser(isEmailVerified: boolean): User {
  return User.rehydrate({
    id: 'user-1',
    email: 'jana@example.com',
    fullName: 'Jana Nováková',
    isEmailVerified,
    isActive: true,
    preferredLanguage: 'cs',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('email verification', () => {
  it('creates a user as verified when the identity provider already verified them', async () => {
    // Google refuses to get this far without `email_verified`, so the address
    // is verified in fact; storing false blocked the owner-invite flow.
    const { repo, users } = makeUserRepository();
    const handler = new CreateUserHandler(repo);

    const { id } = await handler.execute(
      new CreateUserCommand('jana@example.com', 'Jana Nováková', true),
    );

    expect(users.get(id)!.isEmailVerified).toBe(true);
  });

  it('still creates a user as unverified by default', async () => {
    const { repo, users } = makeUserRepository();
    const handler = new CreateUserHandler(repo);

    const { id } = await handler.execute(
      new CreateUserCommand('jana@example.com', 'Jana Nováková'),
    );

    expect(users.get(id)!.isEmailVerified).toBe(false);
  });

  it('marks an existing user verified', async () => {
    // The reported case: the account already exists, stored as unverified,
    // so setting the flag only at creation time would not reach it.
    const { repo, users } = makeUserRepository([existingUser(false)]);
    const handler = new MarkEmailVerifiedHandler(repo);

    await handler.execute(new MarkEmailVerifiedCommand('user-1'));

    expect(users.get('user-1')!.isEmailVerified).toBe(true);
  });

  it('ignores a user that no longer exists', async () => {
    const { repo } = makeUserRepository();
    const handler = new MarkEmailVerifiedHandler(repo);

    await expect(
      handler.execute(new MarkEmailVerifiedCommand('gone')),
    ).resolves.toBeUndefined();
  });
});
