import { Global, Module } from '@nestjs/common';

import { DrizzleService } from './drizzle.service';
import { DrizzleUnitOfWork } from './drizzle.unit-of-work';
import { UNIT_OF_WORK } from '../../shared/application/ports/unit-of-work.port';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
  providers: [
    DrizzleService,
    { provide: UNIT_OF_WORK, useClass: DrizzleUnitOfWork },
  ],
  exports: [DrizzleService, UNIT_OF_WORK],
  imports: [ConfigModule],
})
export class DbModule {}
