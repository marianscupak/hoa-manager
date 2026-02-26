import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthModule } from './modules/auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';

@Module({
  imports: [InfrastructureModule, TenancyModule, IdentityModule, AuthModule],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
