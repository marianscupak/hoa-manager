import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityController } from '@/modules/core/identity/api/identity.controller';
import { CreateUserHandler } from '@/modules/core/identity/application/handlers/create-user.handler';
import { GetUserByEmailHandler } from '@/modules/core/identity/application/handlers/get-user-by-email.handler';
import { GetUserByIdHandler } from '@/modules/core/identity/application/handlers/get-user-by-id.handler';
import { MarkEmailVerifiedHandler } from '@/modules/core/identity/application/handlers/mark-email-verified.handler';
import { UpdateUserLanguageHandler } from '@/modules/core/identity/application/handlers/update-user-language.handler';
import { USER_REPOSITORY } from '@/modules/core/identity/application/ports/user.repository.port';
import { DrizzleUserRepository } from '@/modules/core/identity/infrastructure/persistence/drizzle-user.repository';

const CommandHandlers = [
  CreateUserHandler,
  MarkEmailVerifiedHandler,
  UpdateUserLanguageHandler,
];
const QueryHandlers = [GetUserByIdHandler, GetUserByEmailHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule)],
  controllers: [IdentityController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
  ],
  exports: [],
})
export class IdentityModule {}
