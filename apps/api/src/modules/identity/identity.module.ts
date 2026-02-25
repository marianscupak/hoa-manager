import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { IdentityController } from './api/identity.controller';
import { CreateUserHandler } from './application/handlers/create-user.handler';
import { GetUserByIdHandler } from './application/handlers/get-user-by-id.handler';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { DrizzleUserRepository } from './infrastructure/persistence/drizzle-user.repository';

const CommandHandlers = [CreateUserHandler];
const QueryHandlers = [GetUserByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [IdentityController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
  ],
})
export class IdentityModule {}
