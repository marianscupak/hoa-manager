import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';

@Injectable()
export class SystemActorRunner {
  constructor(private readonly cls: ClsService) {}

  async run<T>(reason: string, work: () => Promise<T>): Promise<T> {
    return this.cls.run(async () => {
      this.cls.set(ACTOR_CLS_KEY, { type: 'SYSTEM', reason });
      return work();
    });
  }
}
