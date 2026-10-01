import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { type GetUserByIdResult } from '@/modules/core/identity/application/handlers/get-user-by-id.handler';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { UserNotFoundError } from '@/modules/core/identity/domain/errors/user-not-found.error';
import type {
  UserAccess,
  UserAccessLookup,
} from '@/shared/application/ports/user-access.port';

/**
 * Identity's answer to the shared access token guard. It asks through the
 * module's own query so the lookup logic stays in one place.
 */
@Injectable()
export class QueryBusUserAccessLookup implements UserAccessLookup {
  constructor(private readonly queryBus: QueryBus) {}

  async findUserAccess(userId: string): Promise<UserAccess | null> {
    try {
      const user = await this.queryBus.execute<
        GetUserByIdQuery,
        GetUserByIdResult
      >(new GetUserByIdQuery(userId));
      return { isActive: user.isActive };
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return null;
      }
      throw err;
    }
  }
}
