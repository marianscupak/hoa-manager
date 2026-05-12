import crypto from 'node:crypto';

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { ClsModule } from 'nestjs-cls';

import { InfrastructureModule } from '@/infrastructure/infrastructure.module';
import { AuthModule } from '@/modules/core/auth/auth.module';
import { IdentityModule } from '@/modules/core/identity/identity.module';
import { InvitationModule } from '@/modules/core/invitation/invitation.module';
import { PropertyModule } from '@/modules/core/property/property.module';
import { TenancyModule } from '@/modules/core/tenancy/tenancy.module';
import { VotingModule } from '@/modules/voting/voting.module';
import { LoggingInterceptor } from '@/shared/api/interceptors/logging.interceptor';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
          (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID(),
      },
    }),
    ScheduleModule.forRoot(),
    InfrastructureModule,
    TenancyModule,
    IdentityModule,
    AuthModule,
    PropertyModule,
    InvitationModule,
    VotingModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
