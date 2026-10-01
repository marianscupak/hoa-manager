import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  INVITE_READ_REPOSITORY,
  type InviteReadRepository,
} from '@/modules/core/property/application/ports/invite-read.repository.port';
import {
  OWNER_READ_REPOSITORY,
  type OwnerReadRepository,
} from '@/modules/core/property/application/ports/owner-read.repository.port';
import {
  UNIT_READ_REPOSITORY,
  type UnitReadRepository,
} from '@/modules/core/property/application/ports/unit-read.repository.port';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

import { GetPropertyOverviewQuery } from './get-property-overview.query';
import type { PropertyOverviewResponseDto } from '../../../api/dto/property-overview-response.dto';

/**
 * Aggregates the property overview snapshot from three read repos:
 * - `UnitReadRepository` for unit totals, units without owners, and the
 *   percentage sum of `buildingShare` values.
 * - `OwnerReadRepository` for the count of "active" owners (i.e. owners
 *   who aren't in a pending-invite state per the existing
 *   `ListOwnersHandler` definition).
 * - `InviteReadRepository` for the pending-invite count + the oldest
 *   pending invite's `createdAt`.
 *
 * The clock is injected so the "now" boundary used to filter expired
 * invites is consistent across the owner and invite queries.
 */
@QueryHandler(GetPropertyOverviewQuery)
export class GetPropertyOverviewHandler
  implements
    IQueryHandler<GetPropertyOverviewQuery, PropertyOverviewResponseDto>
{
  constructor(
    @Inject(UNIT_READ_REPOSITORY)
    private readonly units: UnitReadRepository,
    @Inject(OWNER_READ_REPOSITORY)
    private readonly owners: OwnerReadRepository,
    @Inject(INVITE_READ_REPOSITORY)
    private readonly invites: InviteReadRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(
    query: GetPropertyOverviewQuery,
  ): Promise<PropertyOverviewResponseDto> {
    const now = this.clock.now();
    const [unitOverview, ownerCount, invitesSummary] = await Promise.all([
      this.units.getOverview(query.tenantId, now),
      this.owners.countActive(query.tenantId, now),
      this.invites.getPendingSummary(query.tenantId, now),
    ]);

    return {
      units: {
        total: unitOverview.total,
        withoutOwnersCount: unitOverview.withoutOwnersCount,
        buildingShareSum: unitOverview.buildingShareSum,
      },
      owners: { active: ownerCount },
      invites: {
        pending: invitesSummary.pending,
        oldestPendingCreatedAt:
          invitesSummary.oldestPendingCreatedAt?.toISOString() ?? null,
      },
    };
  }
}
