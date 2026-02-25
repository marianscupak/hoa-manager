import { Global, Module } from '@nestjs/common';

import { DrizzleService } from './drizzle.service';
import { ConfigModule } from '../config/config.module';

@Global()
@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
  imports: [ConfigModule],
})
export class DbModule {}
