import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { GetPendingInviteByOwnerIdQuery } from '@/modules/core/invitation/application/queries/get-pending-invite-by-owner-id.query';

export type PendingInviteResult = {
  expiresAt: Date;
  createdAt: Date;
} | null;

@QueryHandler(GetPendingInviteByOwnerIdQuery)
export class GetPendingInviteByOwnerIdHandler
  implements IQueryHandler<GetPendingInviteByOwnerIdQuery, PendingInviteResult>
{
  constructor(
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
  ) {}

  async execute(
    query: GetPendingInviteByOwnerIdQuery,
  ): Promise<PendingInviteResult> {
    const invite = await this.inviteRepo.findPendingByOwnerId(
      query.tenantId,
      query.ownerId,
    );

    if (!invite) return null;
    return { expiresAt: invite.expiresAt, createdAt: invite.createdAt };
  }
}
