import { TZDate } from '@date-fns/tz';
import { Injectable } from '@nestjs/common';

import { Clock } from '@/shared/application/ports/clock.port';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new TZDate(new Date(), 'UTC');
  }
}
