import { TenantMembershipRole } from '@/shared/domain/membership';

import { GetTenantActivityHandler } from './get-tenant-activity.handler';
import { GetTenantActivityQuery } from './get-tenant-activity.query';
import { Visibility } from '../../../domain/visibility';
import type {
  AuditEventReadRecord,
  AuditEventReadRepository,
} from '../../ports/audit-event-read.repository.port';
import { AuditFormatterRegistry } from '../../services/audit-formatter-registry';
import { VisibilityPolicyService } from '../../services/visibility-policy.service';

function event(
  partial: Partial<AuditEventReadRecord> = {},
): AuditEventReadRecord {
  return {
    id: 'e-1',
    tenantId: 't-1',
    occurredAt: new Date('2026-05-14T10:00:00Z'),
    module: 'VOTING',
    eventType: 'VOTING.VOTE_OPENED' as AuditEventReadRecord['eventType'],
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

describe('GetTenantActivityHandler', () => {
  let handler: GetTenantActivityHandler;
  let repo: jest.Mocked<AuditEventReadRepository>;
  let registry: AuditFormatterRegistry;

  beforeEach(() => {
    repo = {
      findByAggregate: jest.fn(),
      findRecent: jest.fn(),
    };
    registry = new AuditFormatterRegistry();
    // Stub voting formatter so VOTING events render predictably.
    registry.register({
      module: 'VOTING',
      format: (e) => ({
        id: e.id,
        occurredAt: e.occurredAt.toISOString(),
        eventType: e.eventType,
        message: `voting:${e.eventType}`,
        navigateTo: e.aggregate ? `/votes/${e.aggregate.id}` : null,
      }),
    });
    handler = new GetTenantActivityHandler(
      repo,
      new VisibilityPolicyService(),
      registry,
    );
  });

  it("calls repo.findRecent with the viewer's tenant, visibilities, and limit", async () => {
    repo.findRecent.mockResolvedValue([]);
    await handler.execute(
      new GetTenantActivityQuery(
        't-1',
        'u-1',
        [TenantMembershipRole.UNIT_OWNER],
        'en',
        10,
      ),
    );
    expect(repo.findRecent).toHaveBeenCalledWith({
      tenantId: 't-1',
      scope: {
        allowedVisibilities: [Visibility.TENANT_PUBLIC],
        alwaysIncludeForActorUserId: 'u-1',
      },
      limit: 10,
    });
  });

  it.each([
    TenantMembershipRole.ADMIN,
    TenantMembershipRole.BOARD_MEMBER,
    TenantMembershipRole.AUDITOR,
  ])(
    "%s viewer's allowedVisibilities include TENANT_PRIVILEGED",
    async (role) => {
      repo.findRecent.mockResolvedValue([]);
      await handler.execute(
        new GetTenantActivityQuery('t-1', 'u-1', [role], 'en', 10),
      );
      expect(
        repo.findRecent.mock.calls[0][0].scope.allowedVisibilities,
      ).toEqual([Visibility.TENANT_PUBLIC, Visibility.TENANT_PRIVILEGED]);
    },
  );

  it('maps each event through the registered formatter', async () => {
    repo.findRecent.mockResolvedValue([
      event({ id: 'e-1' }),
      event({ id: 'e-2' }),
    ]);
    const result = await handler.execute(
      new GetTenantActivityQuery(
        't-1',
        'u-1',
        [TenantMembershipRole.UNIT_OWNER],
        'en',
        10,
      ),
    );
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      id: 'e-1',
      message: 'voting:VOTING.VOTE_OPENED',
      navigateTo: '/votes/v-1',
    });
  });

  it('dispatches events to the correct module formatter and falls back for unknown modules', async () => {
    repo.findRecent.mockResolvedValue([
      event({ id: 'e-voting', module: 'VOTING' }),
      event({
        id: 'e-future',
        module: 'CORE',
        eventType:
          'CORE.SOMETHING_HAPPENED' as AuditEventReadRecord['eventType'],
        aggregate: null,
      }),
    ]);
    const result = await handler.execute(
      new GetTenantActivityQuery(
        't-1',
        'u-1',
        [TenantMembershipRole.ADMIN],
        'en',
        10,
      ),
    );
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({
      id: 'e-voting',
      message: 'voting:VOTING.VOTE_OPENED',
      navigateTo: '/votes/v-1',
    });
    expect(result.entries[1]).toMatchObject({
      id: 'e-future',
      // fallback in AuditFormatterRegistry uses the raw eventType as message
      message: 'CORE.SOMETHING_HAPPENED',
      navigateTo: null,
    });
  });

  it('preserves the repo result ordering', async () => {
    repo.findRecent.mockResolvedValue([
      event({ id: 'newest', occurredAt: new Date('2026-05-14T12:00:00Z') }),
      event({ id: 'middle', occurredAt: new Date('2026-05-14T11:00:00Z') }),
      event({ id: 'oldest', occurredAt: new Date('2026-05-14T10:00:00Z') }),
    ]);
    const result = await handler.execute(
      new GetTenantActivityQuery(
        't-1',
        'u-1',
        [TenantMembershipRole.UNIT_OWNER],
        'en',
        10,
      ),
    );
    expect(result.entries.map((e) => e.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });
});
