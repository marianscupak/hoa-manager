import { users } from '../../../../infrastructure/db/schema/users';
import { User } from '../../domain/user.entity';

export const UserMapper = {
  toDomain(row: typeof users.$inferSelect): User {
    return User.rehydrate({
      id: row.id,
      email: row.email,
    });
  },
};
