import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { sql } from 'drizzle-orm';

import { DrizzleService } from '@/infrastructure/db/drizzle.service';

@Injectable()
export class DrizzleHealthIndicator extends HealthIndicator {
  constructor(private readonly drizzle: DrizzleService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.drizzle.db.execute(sql`SELECT 1`);
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, {
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  }
}
