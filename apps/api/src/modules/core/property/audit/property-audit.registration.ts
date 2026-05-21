import { Injectable, OnModuleInit } from '@nestjs/common';

import { AuditEventRegistry } from '@/modules/core/audit/application/registry/audit-event.registry';

import { PROPERTY_AUDIT_EVENTS } from './property-audit-events';

@Injectable()
export class PropertyAuditRegistration implements OnModuleInit {
  constructor(private readonly registry: AuditEventRegistry) {}

  onModuleInit(): void {
    for (const ev of PROPERTY_AUDIT_EVENTS) {
      this.registry.register(ev.descriptor);
    }
  }
}
