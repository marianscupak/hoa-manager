import { Global, Module } from '@nestjs/common';

import { ConfigModule } from '@/infrastructure/config/config.module';
import { DrizzleService } from '@/infrastructure/db/drizzle.service';
import { DrizzleUnitOfWork } from '@/infrastructure/db/drizzle.unit-of-work';
import { UNIT_OF_WORK } from '@/shared/application/ports/unit-of-work.port';

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
