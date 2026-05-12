import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { ClockModule } from '@/infrastructure/clock/clock.module';
import { ConfigModule } from '@/infrastructure/config/config.module';
import { DbModule } from '@/infrastructure/db/db.module';
import { HealthModule } from '@/infrastructure/health/health.module';
import { ObservabilityModule } from '@/infrastructure/observability/observability.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    ClockModule,
    HealthModule,
    ObservabilityModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  exports: [
    ConfigModule,
    DbModule,
    ObservabilityModule,
    ClockModule,
    ThrottlerModule,
  ],
})
export class InfrastructureModule {}
