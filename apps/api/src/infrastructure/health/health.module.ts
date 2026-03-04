import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { DrizzleHealthIndicator } from '@/infrastructure/health/drizzle.health-indicator';
import { HealthController } from '@/infrastructure/health/health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator],
})
export class HealthModule {}
