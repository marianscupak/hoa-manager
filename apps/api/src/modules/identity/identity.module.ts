import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { IdentityController } from '@/modules/identity/api/identity.controller';
import { CreateUserHandler } from '@/modules/identity/application/handlers/create-user.handler';
import { GetUserByIdHandler } from '@/modules/identity/application/handlers/get-user-by-id.handler';
import { USER_REPOSITORY } from '@/modules/identity/application/ports/user.repository.port';
import { DrizzleUserRepository } from '@/modules/identity/infrastructure/persistence/drizzle-user.repository';

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
  exports: [USER_REPOSITORY],
})
export class IdentityModule {}
