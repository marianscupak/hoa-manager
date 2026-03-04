import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { IdentityModule } from '@/modules/identity/identity.module';
import { InvitationModule } from '@/modules/invitation/invitation.module';
import { PropertyModule } from '@/modules/property/property.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { LoggingInterceptor } from '@/shared/api/interceptors/logging.interceptor';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';

@Module({
  imports: [
    InfrastructureModule,
    TenancyModule,
    IdentityModule,
    AuthModule,
    PropertyModule,
    InvitationModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
