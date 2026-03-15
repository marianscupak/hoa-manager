import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/core/identity/application/ports/user.repository.port';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler
  implements IQueryHandler<GetUserByEmailQuery>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: GetUserByEmailQuery) {
    return this.users.findByEmail(query.email);
  }
}
