import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    HealthModule,
    ObservabilityModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  exports: [ConfigModule, DbModule, ObservabilityModule],
})
export class InfrastructureModule {}
