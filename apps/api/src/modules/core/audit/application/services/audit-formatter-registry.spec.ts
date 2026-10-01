import { TenantMembershipRole } from '@/shared/domain/membership';

import {
  type AuditEventFormatter,
  type TimelineEntry,
  type ViewerContext,
} from './audit-event-formatter';
import { AuditFormatterRegistry } from './audit-formatter-registry';
import { Visibility } from '../../domain/visibility';
import type { AuditEventReadRecord } from '../ports/audit-event-read.repository.port';

const VIEWER: ViewerContext = {
  viewerUserId: 'u-1',
  viewerRoles: [TenantMembershipRole.UNIT_OWNER],
  viewerLanguage: 'en',
};

function event(partial: Partial<AuditEventReadRecord>): AuditEventReadRecord {
  return {
    id: 'e-1',
    tenantId: 't-1',
    occurredAt: new Date('2026-05-14T10:00:00Z'),
    module: 'VOTING',
    eventType: 'VOTING.VOTE_CREATED' as AuditEventReadRecord['eventType'],
    actor: { type: 'USER', userId: 'u-2', membershipId: null },
    aggregate: { type: 'VOTE', id: 'v-1' },
    entity: null,
    visibility: Visibility.TENANT_PUBLIC,
    payload: {},
    correlationId: null,
    ipAddress: null,
    userAgent: null,
    ...partial,
  };
}

function entry(overrides: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: 'e-1',
    occurredAt: '2026-05-14T10:00:00Z',
    eventType: 'VOTING.VOTE_CREATED',
    message: 'Vote created',
    navigateTo: null,
    ...overrides,
  };
}

describe('AuditFormatterRegistry', () => {
  let registry: AuditFormatterRegistry;

  beforeEach(() => {
    registry = new AuditFormatterRegistry();
  });

  it('dispatches a registered formatter by module', () => {
    const votingFormatter: AuditEventFormatter = {
      module: 'VOTING',
      format: jest
        .fn()
        .mockReturnValue(entry({ message: 'rendered by voting' })),
    };
    registry.register(votingFormatter);

    const result = registry.format(event({ module: 'VOTING' }), VIEWER);

    expect(result.message).toBe('rendered by voting');
    expect(votingFormatter.format).toHaveBeenCalledTimes(1);
  });

  it('renders a generic fallback when no formatter is registered for a module', () => {
    const result = registry.format(event({ module: 'UNKNOWN_MODULE' }), VIEWER);

    expect(result.id).toBe('e-1');
    expect(result.eventType).toBe('VOTING.VOTE_CREATED');
    expect(result.message).toBeDefined();
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.navigateTo).toBeNull();
  });

  it('formatMany() maps an array of events using the registered formatter', () => {
    const votingFormatter: AuditEventFormatter = {
      module: 'VOTING',
      format: (e) => entry({ id: e.id, message: `voting:${e.eventType}` }),
    };
    registry.register(votingFormatter);

    const entries = registry.formatMany(
      [
        event({ id: 'e-1' }),
        event({
          id: 'e-2',
          eventType: 'VOTING.VOTE_OPENED' as AuditEventReadRecord['eventType'],
        }),
      ],
      VIEWER,
    );

    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe('e-1');
    expect(entries[1].message).toBe('voting:VOTING.VOTE_OPENED');
  });

  it('rejects a second registration for the same module', () => {
    const f1: AuditEventFormatter = { module: 'VOTING', format: jest.fn() };
    const f2: AuditEventFormatter = { module: 'VOTING', format: jest.fn() };

    registry.register(f1);
    expect(() => registry.register(f2)).toThrow(/VOTING/);
  });
});
