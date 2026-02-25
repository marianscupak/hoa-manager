import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { IdentityModule } from './modules/identity/identity.module';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';

@Module({
  imports: [InfrastructureModule, IdentityModule],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
