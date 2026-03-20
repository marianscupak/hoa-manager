import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  VOTE_CONSENT_WRITE_REPOSITORY,
  type VoteConsentWriteRepository,
} from '@/modules/voting/application/ports/vote-consent-write.repository.port';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { VoteUnitConsentStatus } from '@/modules/voting/domain/vote/vote.types';
import { ForbiddenException } from '@/shared/application/exceptions/auth.exceptions';
import { DelegationNotFoundException } from '@/shared/application/exceptions/vote.exceptions';

import { RevokeConsentCommand } from './revoke-consent.command';

@CommandHandler(RevokeConsentCommand)
export class RevokeConsentHandler
  implements ICommandHandler<RevokeConsentCommand>
{
  constructor(
    @Inject(VOTE_CONSENT_WRITE_REPOSITORY)
    private readonly consentWriteRepo: VoteConsentWriteRepository,
    @Inject(VOTE_READ_REPOSITORY)
    private readonly voteReadRepo: VoteReadRepository,
  ) {}

  async execute(command: RevokeConsentCommand): Promise<void> {
    const isAdmin =
      command.roles.includes('ADMIN') || command.roles.includes('BOARD_MEMBER');

    const consent = await this.consentWriteRepo.findById(
      command.tenantId,
      command.consentId,
    );

    if (!consent) {
      throw new DelegationNotFoundException();
    }

    if (consent.status === VoteUnitConsentStatus.REVOKED) {
      return;
    }

    if (!isAdmin) {
      const isOwner = await this.voteReadRepo.isOwnerOfConsent(
        command.tenantId,
        command.consentId,
        command.membershipId,
      );

      if (!isOwner) {
        throw new ForbiddenException();
      }
    }

    await this.consentWriteRepo.updateStatus(
      command.consentId,
      VoteUnitConsentStatus.REVOKED,
    );
  }
}
