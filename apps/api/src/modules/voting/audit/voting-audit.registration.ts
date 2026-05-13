import { Injectable, OnModuleInit } from '@nestjs/common';

import { AuditEventRegistry } from '@/modules/core/audit/application/registry/audit-event.registry';

import { VOTING_AUDIT_EVENTS } from './voting-audit-events';

@Injectable()
export class VotingAuditRegistration implements OnModuleInit {
  constructor(private readonly registry: AuditEventRegistry) {}

  onModuleInit(): void {
    for (const ev of VOTING_AUDIT_EVENTS) {
      this.registry.register(ev.descriptor);
    }
  }
}
