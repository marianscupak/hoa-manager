import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import {
  CLOCK,
  type Clock,
} from '../../../../shared/application/ports/clock.port';
import { hashToken } from '../../../../shared/application/utils/token.utils';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '../ports/owner-invite.repository.port';
import { GetOwnerInviteStatusQuery } from '../queries/get-owner-invite-status.query';

export interface InviteStatusResult {
  status: 'valid' | 'expired' | 'accepted' | 'not_found';
  emailMasked?: string;
  expiresAt?: Date;
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
  ) {}

  async execute(query: GetOwnerInviteStatusQuery): Promise<InviteStatusResult> {
    const tokenHash = hashToken(query.rawToken);

    const invite = await this.inviteRepo.findByTokenHash(tokenHash);

    if (!invite) {
      return { status: 'not_found' };
    }

    if (invite.acceptedAt) {
      return {
        status: 'accepted',
        emailMasked: maskEmail(invite.emailNormalized),
      };
    }

    if (invite.expiresAt < this.clock.now()) {
      return {
        status: 'expired',
        emailMasked: maskEmail(invite.emailNormalized),
        expiresAt: invite.expiresAt,
      };
    }

    return {
      status: 'valid',
      emailMasked: maskEmail(invite.emailNormalized),
      expiresAt: invite.expiresAt,
    };
  }
}
