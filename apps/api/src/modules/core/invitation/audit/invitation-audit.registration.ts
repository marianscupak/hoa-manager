import { Injectable, OnModuleInit } from '@nestjs/common';

import { AuditEventRegistry } from '@/modules/core/audit/application/registry/audit-event.registry';

import { INVITATION_AUDIT_EVENTS } from './invitation-audit-events';

@Injectable()
export class InvitationAuditRegistration implements OnModuleInit {
  constructor(private readonly registry: AuditEventRegistry) {}

  onModuleInit(): void {
    for (const ev of INVITATION_AUDIT_EVENTS) {
      this.registry.register(ev.descriptor);
    }
  }
}
