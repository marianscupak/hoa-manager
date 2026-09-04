import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  UNIT_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
  type UnitRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { GetUnitDetailQuery } from '@/modules/core/property/application/queries/get-unit-detail.query';
import type {
  OwnerKind,
  OwnershipPartyType,
} from '@/modules/core/property/domain/ownership-plan';
import { Unit } from '@/modules/core/property/domain/property.entity';
import { UnitNotFoundException } from '@/shared/application/exceptions/property.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { Rational } from '@/shared/domain/rational';

export interface UnitOwnershipDetailMember {
  ownerId: string;
  displayName: string;
  kind: OwnerKind;
}

export interface UnitOwnershipDetailItem {
  id: string;
  partyType: OwnershipPartyType;
  shareNumerator: number;
  shareDenominator: number;
  shareDecimal: string;
  members: UnitOwnershipDetailMember[];
}

export interface UnitDetail extends Unit {
  ownerships: UnitOwnershipDetailItem[];
  owners: string[];
}

@QueryHandler(GetUnitDetailQuery)
export class GetUnitDetailHandler
  implements IQueryHandler<GetUnitDetailQuery, UnitDetail>
{
  constructor(
    @Inject(UNIT_REPOSITORY)
    private readonly unitRepo: UnitRepository,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(query: GetUnitDetailQuery): Promise<UnitDetail> {
    const unit = await this.unitRepo.findById(query.tenantId, query.unitId);

    if (!unit) {
      throw new UnitNotFoundException();
    }

    const [ownerships, tenantOwners] = await Promise.all([
      this.ownershipRepo.listActiveByUnit(
        query.tenantId,
        query.unitId,
        this.clock.now(),
      ),
      this.ownerRepo.listByTenant(query.tenantId),
    ]);

    const ownersById = new Map(tenantOwners.map((o) => [o.id, o]));

    const owners = [
      ...new Set(
        ownerships
          .flatMap((p) => p.memberOwnerIds)
          .map((id) => ownersById.get(id)?.displayName)
          .filter((name): name is string => !!name),
      ),
    ];

    return {
      ...unit,
      ownerships: ownerships.map((party) => ({
        id: party.id,
        partyType: party.partyType,
        shareNumerator: party.shareNumerator,
        shareDenominator: party.shareDenominator,
        shareDecimal: Rational.from(
          party.shareNumerator,
          party.shareDenominator,
        ).toDecimalString(4),
        members: party.memberOwnerIds.map((ownerId) => {
          const owner = ownersById.get(ownerId);
          return {
            ownerId,
            displayName: owner?.displayName ?? '',
            kind: owner?.kind as OwnerKind,
          };
        }),
      })),
      owners,
    };
  }
}
