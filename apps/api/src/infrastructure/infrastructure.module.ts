import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [ConfigModule, DbModule, HealthModule, ObservabilityModule],
  exports: [ConfigModule, DbModule, ObservabilityModule],
})
export class InfrastructureModule {}
