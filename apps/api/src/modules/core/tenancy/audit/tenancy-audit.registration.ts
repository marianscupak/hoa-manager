import { Injectable, OnModuleInit } from '@nestjs/common';

import { AuditEventRegistry } from '@/modules/core/audit/application/registry/audit-event.registry';

import { TENANCY_AUDIT_EVENTS } from './tenancy-audit-events';

@Injectable()
export class TenancyAuditRegistration implements OnModuleInit {
  constructor(private readonly registry: AuditEventRegistry) {}

  onModuleInit(): void {
    for (const ev of TENANCY_AUDIT_EVENTS) {
      this.registry.register(ev.descriptor);
    }
  }
}
