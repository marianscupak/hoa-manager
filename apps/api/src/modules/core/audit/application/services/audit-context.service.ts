import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { AUDIT_CLS_KEYS } from '@/modules/core/audit/infrastructure/cls/audit-context.keys';

@Injectable()
export class AuditContextService {
  constructor(private readonly cls: ClsService) {}

  requireActor(): AuditActor {
    const actor = this.cls.get<AuditActor | undefined>(AUDIT_CLS_KEYS.actor);
    if (!actor) {
      throw new Error(
        'No audit actor in CLS — wrap scheduler calls in SystemActorRunner or run inside a request',
      );
    }
    return actor;
  }
}
