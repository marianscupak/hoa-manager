import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../ports/user-repository.port';
import { GetUserByIdQuery } from '../queries/get-user-by-id.query';

export type GetUserByIdResult = { id: string; email: string };

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<
  GetUserByIdQuery,
  GetUserByIdResult
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<GetUserByIdResult> {
    const user = await this.users.findById(query.id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return { id: user.id, email: user.email };
  }
}
