import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/core/identity/application/ports/user.repository.port';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { UserNotFoundError } from '@/modules/core/identity/domain/errors/user-not-found.error';

export type GetUserByIdResult = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  preferredLanguage: string;
};

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler
  implements IQueryHandler<GetUserByIdQuery, GetUserByIdResult>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<GetUserByIdResult> {
    const user = await this.users.findById(query.id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      preferredLanguage: user.preferredLanguage,
    };
  }
}
