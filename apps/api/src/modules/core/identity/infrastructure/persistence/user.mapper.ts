import { users } from '@/infrastructure/db/schema/core/users';
import { User } from '@/modules/core/identity/domain/user.entity';

export const UserMapper = {
  toDomain(row: typeof users.$inferSelect): User {
    return User.rehydrate({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      isEmailVerified: row.isEmailVerified,
      isActive: row.isActive,
      preferredLanguage: row.preferredLanguage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },
};
