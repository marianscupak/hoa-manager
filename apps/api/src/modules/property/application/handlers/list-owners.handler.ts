import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';

import {
  CLOCK,
  type Clock,
} from '../../../../shared/application/ports/clock.port';
import { GetPendingInviteByOwnerIdQuery } from '../../../invitation/application/queries/get-pending-invite-by-owner-id.query';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '../ports/property.repository.port';
import { ListOwnersQuery } from '../queries/list-owners.query';

export interface OwnerWithInviteStatus {
  id: string;
  tenantId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  inviteStatus: 'pending' | 'expired' | null;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(ListOwnersQuery)
export class ListOwnersHandler implements IQueryHandler<
  ListOwnersQuery,
  OwnerWithInviteStatus[]
> {
  constructor(
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    private readonly queryBus: QueryBus,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(query: ListOwnersQuery): Promise<OwnerWithInviteStatus[]> {
    const owners = await this.ownerRepo.listByTenant(query.tenantId);
    const now = this.clock.now();

    return Promise.all(
      owners.map(async (owner) => {
        let inviteStatus: 'pending' | 'expired' | null = null;

        if (!owner.userId && owner.email) {
          const invite = await this.queryBus.execute<
            GetPendingInviteByOwnerIdQuery,
            { expiresAt: Date } | null
          >(new GetPendingInviteByOwnerIdQuery(query.tenantId, owner.id));

          if (invite) {
            inviteStatus = invite.expiresAt > now ? 'pending' : 'expired';
          }
        }

        return { ...owner, inviteStatus };
      }),
    );
  }
}
