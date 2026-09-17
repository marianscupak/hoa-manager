import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';

import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { GetOwnerInviteStatusQuery } from '@/modules/core/invitation/application/queries/get-owner-invite-status.query';
import { InviteStatus } from '@/modules/core/invitation/domain/invite-status';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import { hashToken } from '@/shared/application/utils/token.utils';

export interface InviteStatusResult {
  status: InviteStatus;
  emailMasked?: string;
  expiresAt?: Date;
  /** Only meaningful on a `valid` invite. */
  accountExists?: boolean;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

@QueryHandler(GetOwnerInviteStatusQuery)
export class GetOwnerInviteStatusHandler
  implements IQueryHandler<GetOwnerInviteStatusQuery, InviteStatusResult>
{
  constructor(
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(query: GetOwnerInviteStatusQuery): Promise<InviteStatusResult> {
    const tokenHash = hashToken(query.rawToken);

    const invite = await this.inviteRepo.findByTokenHash(tokenHash);

    if (!invite) {
      return { status: 'not_found' };
    }

    if (invite.acceptedAt) {
      // Strip details on stale invites to avoid enumeration via leaked links
      return { status: 'accepted' };
    }

    if (invite.expiresAt < this.clock.now()) {
      return { status: 'expired' };
    }

    // The token is itself the secret and its holder received the invite mail,
    // so this tells them nothing they did not already know — and without it
    // the page would offer a registration that is bound to fail.
    const existing = await this.queryBus.execute(
      new GetUserByEmailQuery(invite.emailNormalized),
    );

    return {
      status: 'valid',
      emailMasked: maskEmail(invite.emailNormalized),
      expiresAt: invite.expiresAt,
      accountExists: !!existing,
    };
  }
}
