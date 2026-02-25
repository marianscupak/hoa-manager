import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UserMapper } from './user.mapper';
import { DrizzleService } from '../../../../infrastructure/db/drizzle.service';
import { users } from '../../../../infrastructure/db/schema/users';
import { UserRepository } from '../../application/ports/user-repository.port';
import { User } from '../../domain/user.entity';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.drizzle.db.query.users.findFirst({
      where: (u) => eq(u.id, id),
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = User.normalizeEmail(email);

    const row = await this.drizzle.db.query.users.findFirst({
      where: (u) => eq(u.email, normalized),
    });

    return row ? UserMapper.toDomain(row) : null;
  }

  async insert(user: User): Promise<User> {
    const [inserted] = await this.drizzle.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
      })
      .returning();

    return UserMapper.toDomain(inserted);
  }
}
