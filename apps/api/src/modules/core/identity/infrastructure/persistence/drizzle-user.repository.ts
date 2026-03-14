import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DRIZZLE_TX_STORAGE } from '@/infrastructure/db/drizzle.unit-of-work';
import { users } from '@/infrastructure/db/schema/core/users';
import { UserRepository } from '@/modules/core/identity/application/ports/user.repository.port';
import { User } from '@/modules/core/identity/domain/user.entity';
import { UserMapper } from '@/modules/core/identity/infrastructure/persistence/user.mapper';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db() {
    return DRIZZLE_TX_STORAGE.getStore() ?? this.drizzle.db;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return row ? UserMapper.toDomain(row) : null;
  }

  async create(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const [inserted] = await this.db
      .insert(users)
      .values({
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        preferredLanguage: user.preferredLanguage,
      })
      .returning();

    return UserMapper.toDomain(inserted);
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({
        ...(updates.email && { email: updates.email }),
        ...(updates.fullName && { fullName: updates.fullName }),
        ...(updates.isEmailVerified !== undefined && {
          isEmailVerified: updates.isEmailVerified,
        }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.preferredLanguage && {
          preferredLanguage: updates.preferredLanguage,
        }),
      })
      .where(eq(users.id, id))
      .returning();

    return UserMapper.toDomain(updated);
  }
}
