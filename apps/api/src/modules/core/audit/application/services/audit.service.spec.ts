import { z } from 'zod';

import type { AuditEventWriteRepository } from '@/modules/core/audit/application/ports/audit-event-write.repository.port';
import { AuditEventRegistry } from '@/modules/core/audit/application/registry/audit-event.registry';
import type { AuditEvent } from '@/modules/core/audit/domain/audit-event';
import { Visibility } from '@/modules/core/audit/domain/visibility';

import { AuditService } from './audit.service';

const TEST_EVENT_TYPE = 'VOTING.VOTE_OPENED' as const;

const baseEvent = (): AuditEvent => ({
  occurredAt: new Date('2026-05-13T10:00:00Z'),
  tenantId: 'tenant-1',
  module: 'VOTING',
  eventType: TEST_EVENT_TYPE as never,
  actor: { type: 'USER', userId: 'user-1', membershipId: 'm-1' },
  aggregate: { type: 'VOTE', id: 'vote-1' },
  entity: null,
  visibility: Visibility.TENANT_PUBLIC,
  payload: { foo: 'bar' },
});

const makeClsStub = (actor: unknown) => ({
  get: jest.fn((key: string) => {
    if (key === 'audit.actor') return actor;
    return null;
  }),
  getId: jest.fn(() => 'corr-1'),
});

describe('AuditService.append', () => {
  let registry: AuditEventRegistry;
  let repo: jest.Mocked<AuditEventWriteRepository>;
  let cls: ReturnType<typeof makeClsStub>;
  let service: AuditService;

  beforeEach(() => {
    registry = new AuditEventRegistry();
    registry.register({
      eventType: TEST_EVENT_TYPE as never,
      module: 'VOTING',
      payloadSchema: z.object({ foo: z.string() }),
      visibility: Visibility.TENANT_PUBLIC,
      tenantRequired: true,
      aggregateType: 'VOTE',
      entityType: null,
    });
    repo = { append: jest.fn(), appendMany: jest.fn() };
    cls = makeClsStub({ type: 'USER', userId: 'user-1', membershipId: 'm-1' });
    service = new AuditService(repo, registry, cls as never);
  });

  it('appends a valid event', async () => {
    await service.append(baseEvent());
    expect(repo.append).toHaveBeenCalledTimes(1);
    expect(repo.append.mock.calls[0][0]).toMatchObject({
      eventType: TEST_EVENT_TYPE,
      correlationId: 'corr-1',
    });
  });

  it('throws when tenantId is missing for a tenant-required event', async () => {
    const e = baseEvent();
    e.tenantId = null;
    await expect(service.append(e)).rejects.toThrow(/requires tenantId/);
    expect(repo.append).not.toHaveBeenCalled();
  });

  it('throws when aggregate.type mismatches descriptor', async () => {
    const e = baseEvent();
    e.aggregate = { type: 'UNIT', id: 'unit-1' };
    await expect(service.append(e)).rejects.toThrow(/aggregate\.type=VOTE/);
    expect(repo.append).not.toHaveBeenCalled();
  });

  it('throws when visibility differs from descriptor (factory tampering guard)', async () => {
    const e = baseEvent();
    e.visibility = Visibility.TENANT_PRIVILEGED;
    await expect(service.append(e)).rejects.toThrow(/fixed visibility/);
    expect(repo.append).not.toHaveBeenCalled();
  });

  it('throws when payload fails the Zod schema', async () => {
    const e = baseEvent();
    e.payload = { foo: 42 };
    await expect(service.append(e)).rejects.toThrow();
    expect(repo.append).not.toHaveBeenCalled();
  });

  it('throws when CLS actor is missing', async () => {
    cls.get = jest.fn((_key: string) => null);
    service = new AuditService(repo, registry, cls as never);
    await expect(service.append(baseEvent())).rejects.toThrow(
      /No audit actor in CLS/,
    );
    expect(repo.append).not.toHaveBeenCalled();
  });

  it('throws when CLS actor type differs from event actor type', async () => {
    cls = makeClsStub({ type: 'SYSTEM', reason: 'scheduler' });
    service = new AuditService(repo, registry, cls as never);
    await expect(service.append(baseEvent())).rejects.toThrow(
      /actor\.type=USER does not match CLS actor\.type=SYSTEM/,
    );
    expect(repo.append).not.toHaveBeenCalled();
  });
});
