import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { AUDIT_CLS_KEYS } from './audit-context.keys';

@Injectable()
export class SystemActorRunner {
  constructor(private readonly cls: ClsService) {}

  async run<T>(reason: string, work: () => Promise<T>): Promise<T> {
    return this.cls.run(async () => {
      this.cls.set(AUDIT_CLS_KEYS.actor, { type: 'SYSTEM', reason });
      return work();
    });
  }
}
