import { z } from 'zod';

import { Visibility } from '@/modules/core/audit/domain/visibility';

import {
  AuditEventRegistry,
  type AuditEventDescriptor,
} from './audit-event.registry';

const descriptor: AuditEventDescriptor = {
  eventType: 'TEST.SOMETHING_HAPPENED',
  module: 'TEST',
  payloadSchema: z.object({}),
  visibility: Visibility.TENANT_PUBLIC,
  tenantRequired: true,
  aggregateType: null,
  entityType: null,
};

describe('AuditEventRegistry', () => {
  it('describes a registered event type', () => {
    const registry = new AuditEventRegistry();
    registry.register(descriptor);

    expect(registry.describe('TEST.SOMETHING_HAPPENED')).toBe(descriptor);
  });

  it('refuses to register the same event type twice', () => {
    const registry = new AuditEventRegistry();
    registry.register(descriptor);

    expect(() => registry.register({ ...descriptor })).toThrow(
      'Duplicate audit event_type: TEST.SOMETHING_HAPPENED',
    );
  });

  it('refuses to describe an event type no module registered', () => {
    const registry = new AuditEventRegistry();

    expect(() => registry.describe('TEST.NEVER_REGISTERED')).toThrow(
      'Unknown audit event_type: TEST.NEVER_REGISTERED',
    );
  });
});
