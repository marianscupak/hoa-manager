import { AsyncLocalStorage } from 'async_hooks';

import { Injectable } from '@nestjs/common';

import { DrizzleService } from './drizzle.service';
import { UnitOfWork } from '../../shared/application/ports/unit-of-work.port';

export const DRIZZLE_TX_STORAGE = new AsyncLocalStorage<any>();

@Injectable()
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly drizzleService: DrizzleService) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
    return this.drizzleService.db.transaction(async (tx) => {
      return DRIZZLE_TX_STORAGE.run(tx, async () => {
        return work();
      });
    });
  }
}
