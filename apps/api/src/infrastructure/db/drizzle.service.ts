import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { ConfigService } from '../config/config.service';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  public db!: NodePgDatabase;
  private pool!: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: this.configService.get('DATABASE_URL'),
    });

    this.db = drizzle(this.pool);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
