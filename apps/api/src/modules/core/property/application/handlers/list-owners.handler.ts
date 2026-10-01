import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';

import {
  OWNER_REPOSITORY,
  UNIT_OWNERSHIP_REPOSITORY,
  type OwnerRepository,
  type UnitOwnershipRepository,
} from '@/modules/core/property/application/ports/property.repository.port';
import { GetPendingInviteByOwnerIdQuery } from '@/modules/core/property/application/queries/get-pending-invite-by-owner-id.query';
import { ListOwnersQuery } from '@/modules/core/property/application/queries/list-owners.query';
import type { OwnerKind } from '@/modules/core/property/domain/ownership-plan';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';

export interface OwnerWithInviteStatus {
  id: string;
  tenantId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  kind: OwnerKind;
  ico: string | null;
  inviteStatus: 'pending' | 'expired' | null;
  inviteCreatedAt: Date | null;
  hasOwnershipRecords: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ListOwnersQuery)
export class ListOwnersHandler
  implements IQueryHandler<ListOwnersQuery, OwnerWithInviteStatus[]>
{
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    private readonly queryBus: QueryBus,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(UNIT_OWNERSHIP_REPOSITORY)
    private readonly ownershipRepo: UnitOwnershipRepository,
  ) {}

  async execute(query: ListOwnersQuery): Promise<OwnerWithInviteStatus[]> {
    const owners = await this.ownerRepo.listByTenant(query.tenantId);
    const now = this.clock.now();
    const referenced = await this.ownershipRepo.listReferencedOwnerIds(
      query.tenantId,
    );

    return Promise.all(
      owners.map(async (owner) => {
        let inviteStatus: 'pending' | 'expired' | null = null;
        let inviteCreatedAt: Date | null = null;

        if (!owner.userId && owner.email) {
          const invite = await this.queryBus.execute<
            GetPendingInviteByOwnerIdQuery,
            { expiresAt: Date; createdAt: Date } | null
          >(new GetPendingInviteByOwnerIdQuery(query.tenantId, owner.id));

          if (invite) {
            inviteStatus = invite.expiresAt > now ? 'pending' : 'expired';
            inviteCreatedAt = invite.createdAt;
          }
        }

        return {
          id: owner.id,
          tenantId: owner.tenantId,
          displayName: owner.displayName,
          email: owner.email,
          userId: owner.userId,
          kind: owner.kind,
          ico: owner.ico,
          inviteStatus,
          inviteCreatedAt,
          hasOwnershipRecords: referenced.has(owner.id),
          createdAt: owner.createdAt,
          updatedAt: owner.updatedAt,
        };
      }),
    );
  }
}
