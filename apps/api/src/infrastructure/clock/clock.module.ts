import { Global, Module } from '@nestjs/common';

import { SystemClock } from '@/infrastructure/clock/system-clock';
import { CLOCK } from '@/shared/application/ports/clock.port';

@Global()
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class ClockModule {}
