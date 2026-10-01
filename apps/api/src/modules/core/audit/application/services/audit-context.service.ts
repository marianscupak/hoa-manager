import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';
import type { AuditActor } from '@/shared/domain/actor';

@Injectable()
export class AuditContextService {
  constructor(private readonly cls: ClsService) {}

  requireActor(): AuditActor {
    const actor = this.cls.get<AuditActor | undefined>(ACTOR_CLS_KEY);
    if (!actor) {
      throw new Error(
        'No audit actor in CLS — wrap scheduler calls in SystemActorRunner or run inside a request',
      );
    }
    return actor;
  }
}
