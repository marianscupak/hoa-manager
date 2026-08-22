import { Injectable } from '@nestjs/common';
import type { z } from 'zod';

import type { AuditEventType } from '@/modules/core/audit/domain/audit-event-types';
import type { Visibility } from '@/modules/core/audit/domain/visibility';

export interface AuditEventDescriptor {
  eventType: AuditEventType;
  module: string;
  payloadSchema: z.ZodTypeAny;
  visibility: Visibility;
  tenantRequired: boolean;
  aggregateType: string | null;
  entityType: string | null;
}

@Injectable()
export class AuditEventRegistry {
  private readonly descriptors = new Map<
    AuditEventType,
    AuditEventDescriptor
  >();

  register(descriptor: AuditEventDescriptor): void {
    if (this.descriptors.has(descriptor.eventType)) {
      throw new Error(`Duplicate audit event_type: ${descriptor.eventType}`);
    }
    this.descriptors.set(descriptor.eventType, descriptor);
  }

  describe(eventType: AuditEventType): AuditEventDescriptor {
    const descriptor = this.descriptors.get(eventType);
    if (!descriptor) {
      throw new Error(`Unknown audit event_type: ${eventType}`);
    }
    return descriptor;
  }
}
