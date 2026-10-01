import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { QueryBusUserAccessLookup } from '@/modules/core/identity/infrastructure/user-access.lookup';
import { USER_ACCESS_LOOKUP } from '@/shared/application/ports/user-access.port';

/**
 * Ports that shared code declares and identity implements. Global so the
 * access token guard can inject USER_ACCESS_LOOKUP in every module without
 * each of them importing IdentityModule.
 */
@Global()
@Module({
  imports: [CqrsModule],
  providers: [
    { provide: USER_ACCESS_LOOKUP, useClass: QueryBusUserAccessLookup },
  ],
  exports: [USER_ACCESS_LOOKUP],
})
export class IdentityPortsModule {}
