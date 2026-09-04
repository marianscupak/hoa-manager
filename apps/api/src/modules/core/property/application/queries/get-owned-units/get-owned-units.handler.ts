import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { OwnedUnitResponseDto } from '@/modules/core/property/api/dto/owned-unit-response.dto';
import {
  UNIT_READ_REPOSITORY,
  type UnitReadRepository,
} from '@/modules/core/property/application/ports/unit-read.repository.port';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

import { GetOwnedUnitsQuery } from './get-owned-units.query';

/**
 * Returns the list of units the calling membership currently owns.
 *
 * Sorting is done in the handler (rather than the repo) so the
 * read-repository contract stays focused on the SQL filter and the
 * presentation order is owned by the application layer. `localeCompare`
 * gives a natural ordering for human-facing `unitNo` strings
 * (e.g. "A-1" < "A-10" < "B-2").
 */
@QueryHandler(GetOwnedUnitsQuery)
export class GetOwnedUnitsHandler
  implements IQueryHandler<GetOwnedUnitsQuery, OwnedUnitResponseDto[]>
{
  constructor(
    @Inject(UNIT_READ_REPOSITORY)
    private readonly repo: UnitReadRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(query: GetOwnedUnitsQuery): Promise<OwnedUnitResponseDto[]> {
    const rows = await this.repo.findOwnedByMembership({
      tenantId: query.tenantId,
      membershipId: query.membershipId,
      now: this.clock.now(),
    });
    return [...rows].sort((a, b) => a.unitNo.localeCompare(b.unitNo));
  }
}
