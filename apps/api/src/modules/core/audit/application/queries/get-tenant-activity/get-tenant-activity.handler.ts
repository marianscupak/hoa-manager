import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  AUDIT_EVENT_READ_REPOSITORY,
  type AuditEventReadRepository,
} from '../../ports/audit-event-read.repository.port';
import { AuditFormatterRegistry } from '../../services/audit-formatter-registry';
import { VisibilityPolicyService } from '../../services/visibility-policy.service';

import { GetTenantActivityQuery } from './get-tenant-activity.query';
import type { TenantActivityResponseDto } from '../../../api/dto/tenant-activity-response.dto';

@QueryHandler(GetTenantActivityQuery)
export class GetTenantActivityHandler
  implements IQueryHandler<GetTenantActivityQuery, TenantActivityResponseDto>
{
  constructor(
    @Inject(AUDIT_EVENT_READ_REPOSITORY)
    private readonly auditReadRepo: AuditEventReadRepository,
    private readonly visibilityPolicy: VisibilityPolicyService,
    private readonly registry: AuditFormatterRegistry,
  ) {}

  async execute(
    query: GetTenantActivityQuery,
  ): Promise<TenantActivityResponseDto> {
    const events = await this.auditReadRepo.findRecent({
      tenantId: query.tenantId,
      scope: {
        allowedVisibilities: this.visibilityPolicy.fromRoles(query.viewerRoles),
        alwaysIncludeForActorUserId: query.viewerUserId,
      },
      limit: query.limit,
    });

    const entries = this.registry.formatMany(events, {
      viewerUserId: query.viewerUserId,
      viewerRoles: query.viewerRoles,
      viewerLanguage: query.viewerLanguage,
    });

    return {
      entries: entries.map((e) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        eventType: e.eventType,
        message: e.message,
        navigateTo: e.navigateTo,
      })),
    };
  }
}
