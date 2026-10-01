import { Inject, Injectable } from '@nestjs/common';

import {
  AUDIT_EVENT_READ_REPOSITORY,
  type AuditEventReadRepository,
} from '@/modules/core/audit/application/ports/audit-event-read.repository.port';
import { VisibilityPolicyService } from '@/modules/core/audit/application/services/visibility-policy.service';
import { Visibility } from '@/modules/core/audit/domain/visibility';
import { VoteNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { TenantMembershipRole } from '@/shared/domain/membership';

import { TenantLookup } from './tenant.lookup';
import { VoteElectorateSnapshotLookup } from './vote-electorate-snapshot.lookup';
import type { VoteAuditExportDto } from '../../api/dto/vote-audit-export.dto';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '../../application/ports/vote-read.repository.port';

export interface ExportInput {
  tenantId: string;
  voteId: string;
  exportedByMembershipId: string;
  exportedByLabel: string;
  exporterRoles: TenantMembershipRole[];
}

@Injectable()
export class VoteAuditExporterService {
  constructor(
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
    @Inject(AUDIT_EVENT_READ_REPOSITORY)
    private readonly auditReadRepo: AuditEventReadRepository,
    private readonly electorateLookup: VoteElectorateSnapshotLookup,
    private readonly tenantLookup: TenantLookup,
    private readonly visibilityPolicy: VisibilityPolicyService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async export(input: ExportInput): Promise<VoteAuditExportDto> {
    const vote = await this.voteReadRepo.findDetailById(
      input.tenantId,
      input.voteId,
    );
    if (!vote) throw new VoteNotFoundException();

    const [tenant, electorate, results, allEvents] = await Promise.all([
      this.tenantLookup.findById(input.tenantId),
      this.electorateLookup.findSnapshotWithLabels(
        input.tenantId,
        input.voteId,
      ),
      this.voteReadRepo.findResultsByVoteId(input.tenantId, input.voteId),
      this.auditReadRepo.findByAggregate({
        tenantId: input.tenantId,
        aggregateType: 'VOTE',
        aggregateId: input.voteId,
        scope: {
          allowedVisibilities: this.visibilityPolicy.fromRoles(
            input.exporterRoles,
          ),
        },
      }),
    ]);

    // Defensive: visibilityPolicy already excludes SYSTEM_INTERNAL today, but
    // pin the invariant here so audit exports stay non-internal even if the
    // policy widens in the future.
    const events = allEvents.filter(
      (e) => e.visibility !== Visibility.SYSTEM_INTERNAL,
    );

    return {
      exportMeta: {
        schemaVersion: '1.0',
        exportedAt: this.clock.now().toISOString(),
        exportedByMembershipId: input.exportedByMembershipId,
        exportedByLabel: input.exportedByLabel,
        tenantId: input.tenantId,
        tenantName: tenant?.name ?? '',
      },
      vote: vote as unknown as Record<string, unknown>,
      electorateSnapshot: electorate as unknown as Record<string, unknown>,
      results: (results as unknown as Record<string, unknown>) ?? null,
      auditEvents: events.map((e) => ({
        id: e.id,
        occurredAt: e.occurredAt.toISOString(),
        eventType: e.eventType,
        module: e.module,
        actor: e.actor,
        aggregate: e.aggregate,
        entity: e.entity,
        visibility: e.visibility,
        payload: e.payload,
        correlationId: e.correlationId,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
      })),
    };
  }
}
