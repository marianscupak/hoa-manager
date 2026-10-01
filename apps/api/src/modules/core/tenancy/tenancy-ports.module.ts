import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { QueryBusMembershipAccessLookup } from '@/modules/core/tenancy/infrastructure/membership-access.lookup';
import { MEMBERSHIP_ACCESS_LOOKUP } from '@/shared/application/ports/membership-access.port';

/**
 * Ports that shared code declares and tenancy implements. Global so the
 * tenant context guard can inject MEMBERSHIP_ACCESS_LOOKUP in every module
 * without each of them importing TenancyModule.
 */
@Global()
@Module({
  imports: [CqrsModule],
  providers: [
    {
      provide: MEMBERSHIP_ACCESS_LOOKUP,
      useClass: QueryBusMembershipAccessLookup,
    },
  ],
  exports: [MEMBERSHIP_ACCESS_LOOKUP],
})
export class TenancyPortsModule {}
