import type { AuditEventReadRepository } from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import { VisibilityPolicyService } from '@/modules/core/audit/application/services/visibility-policy.service';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { TenantMembershipRole } from '@/modules/core/tenancy/domain/tenant.entity';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import type { Clock } from '@/shared/application/ports/clock.port';

import { VoteAuditExporterService } from './vote-audit-exporter.service';

const FIXED_NOW = new Date('2026-05-13T10:00:00Z');
const fakeClock: Clock = { now: () => FIXED_NOW };

describe('VoteAuditExporterService', () => {
  let voteRepo: { findDetailById: jest.Mock; findResultsByVoteId: jest.Mock };
  let auditRepo: jest.Mocked<AuditEventReadRepository>;
  let electorateLookup: { findSnapshotWithLabels: jest.Mock };
  let tenantLookup: { findById: jest.Mock };
  let service: VoteAuditExporterService;

  beforeEach(() => {
    voteRepo = {
      findDetailById: jest.fn(),
      findResultsByVoteId: jest.fn(),
    };
    auditRepo = {
      findByAggregate: jest.fn(),
    } as unknown as jest.Mocked<AuditEventReadRepository>;
    electorateLookup = { findSnapshotWithLabels: jest.fn() };
    tenantLookup = { findById: jest.fn() };
    service = new VoteAuditExporterService(
      voteRepo as never,
      auditRepo,
      electorateLookup as never,
      tenantLookup as never,
      new VisibilityPolicyService(),
      fakeClock,
    );
  });

  it('throws VoteNotFoundException if the vote does not exist', async () => {
    voteRepo.findDetailById.mockResolvedValue(null);
    await expect(
      service.export({
        tenantId: 't-1',
        voteId: 'v-1',
        exportedByMembershipId: 'm-1',
        exportedByLabel: 'Admin',
        exporterRoles: [TenantMembershipRole.ADMIN],
      }),
    ).rejects.toBeInstanceOf(VoteNotFoundException);
  });

  it('composes vote + electorate + results + events with schemaVersion 1.0', async () => {
    voteRepo.findDetailById.mockResolvedValue({
      id: 'v-1',
      title: 'Bylaws',
      tenantId: 't-1',
      questions: [],
    });
    voteRepo.findResultsByVoteId.mockResolvedValue({ quorumMet: true });
    electorateLookup.findSnapshotWithLabels.mockResolvedValue({
      units: [],
      totalUnits: 0,
      totalWeight: '0/1',
      totalWeightDecimal: '0.0000',
    });
    tenantLookup.findById.mockResolvedValue({ id: 't-1', name: 'HOA-1' });
    auditRepo.findByAggregate.mockResolvedValue([
      {
        id: 'e-1',
        occurredAt: new Date('2026-05-13T09:00:00Z'),
        tenantId: 't-1',
        module: 'VOTING',
        eventType: 'VOTING.VOTE_OPENED' as never,
        actor: { type: 'USER', userId: 'u-1', membershipId: 'm-1' },
        aggregate: { type: 'VOTE', id: 'v-1' },
        entity: null,
        visibility: Visibility.TENANT_PUBLIC,
        payload: {
          openedAt: '...',
          labels: { voteTitle: 'Bylaws', openedBy: 'John' },
        },
        correlationId: 'corr-1',
        ipAddress: '127.0.0.1',
        userAgent: 'curl/8',
      },
    ]);

    const result = await service.export({
      tenantId: 't-1',
      voteId: 'v-1',
      exportedByMembershipId: 'm-1',
      exportedByLabel: 'Admin',
      exporterRoles: [TenantMembershipRole.ADMIN],
    });

    expect(result.exportMeta.schemaVersion).toBe('1.0');
    expect(result.exportMeta.exportedAt).toBe(FIXED_NOW.toISOString());
    expect(result.exportMeta.tenantName).toBe('HOA-1');
    expect(result.vote).toMatchObject({ id: 'v-1', title: 'Bylaws' });
    expect(result.electorateSnapshot).toEqual({
      units: [],
      totalUnits: 0,
      totalWeight: '0/1',
      totalWeightDecimal: '0.0000',
    });
    expect(result.results).toEqual({ quorumMet: true });
    expect(result.auditEvents).toHaveLength(1);
    expect(result.auditEvents[0]).toMatchObject({
      id: 'e-1',
      eventType: 'VOTING.VOTE_OPENED',
      module: 'VOTING',
      correlationId: 'corr-1',
    });
  });

  it('returns an empty auditEvents array for an un-audited vote', async () => {
    voteRepo.findDetailById.mockResolvedValue({
      id: 'v-1',
      title: 'X',
      tenantId: 't-1',
      questions: [],
    });
    voteRepo.findResultsByVoteId.mockResolvedValue(null);
    electorateLookup.findSnapshotWithLabels.mockResolvedValue({
      units: [],
      totalUnits: 0,
      totalWeight: '0/1',
      totalWeightDecimal: '0.0000',
    });
    tenantLookup.findById.mockResolvedValue({ id: 't-1', name: 'HOA-1' });
    auditRepo.findByAggregate.mockResolvedValue([]);

    const result = await service.export({
      tenantId: 't-1',
      voteId: 'v-1',
      exportedByMembershipId: 'm-1',
      exportedByLabel: 'Admin',
      exporterRoles: [TenantMembershipRole.ADMIN],
    });

    expect(result.auditEvents).toEqual([]);
    expect(result.results).toBeNull();
  });

  it('passes privileged visibility scope to the audit repo', async () => {
    voteRepo.findDetailById.mockResolvedValue({
      id: 'v-1',
      title: 'X',
      tenantId: 't-1',
      questions: [],
    });
    voteRepo.findResultsByVoteId.mockResolvedValue(null);
    electorateLookup.findSnapshotWithLabels.mockResolvedValue({
      units: [],
      totalUnits: 0,
      totalWeight: '0/1',
      totalWeightDecimal: '0.0000',
    });
    tenantLookup.findById.mockResolvedValue({ id: 't-1', name: 'HOA-1' });
    auditRepo.findByAggregate.mockResolvedValue([]);

    await service.export({
      tenantId: 't-1',
      voteId: 'v-1',
      exportedByMembershipId: 'm-1',
      exportedByLabel: 'Admin',
      exporterRoles: [TenantMembershipRole.ADMIN],
    });

    expect(auditRepo.findByAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: expect.objectContaining({
          allowedVisibilities: expect.arrayContaining([
            Visibility.TENANT_PUBLIC,
            Visibility.TENANT_PRIVILEGED,
          ]),
        }),
      }),
    );
  });
});
