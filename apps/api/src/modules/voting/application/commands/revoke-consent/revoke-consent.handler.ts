import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuditContextService } from '@/modules/core/audit/application/services/audit-context.service';
import { AuditService } from '@/modules/core/audit/application/services/audit.service';
import {
  VOTE_CONSENT_WRITE_REPOSITORY,
  type VoteConsentWriteRepository,
} from '@/modules/voting/application/ports/vote-consent-write.repository.port';
import {
  VOTE_READ_REPOSITORY,
  type VoteReadRepository,
} from '@/modules/voting/application/ports/vote-read.repository.port';
import { VoteConsentRevokedAuditEvent } from '@/modules/voting/audit/events/vote-consent-revoked.event';
import { VotingAuditLabelResolver } from '@/modules/voting/audit/label-resolver.service';
import { VoteUnitConsentStatus } from '@/modules/voting/domain/vote/vote.types';
import { ForbiddenException } from '@/shared/application/exceptions/auth.exceptions';
import { DelegationNotFoundException } from '@/shared/application/exceptions/vote.exceptions';
import { type Clock, CLOCK } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

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
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(CLOCK)
    private readonly clock: Clock,
    private readonly auditService: AuditService,
    private readonly auditContext: AuditContextService,
    private readonly labelResolver: VotingAuditLabelResolver,
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

    // `null` when the grantor has no user account (e.g. a POA recorded for
    // an account-less SJM spouse) — that's a normal state, not an error:
    // there is simply no membership to attribute a "self-revoke" to.
    const ownerMembershipId = await this.voteReadRepo.getMembershipByOwnerId(
      command.tenantId,
      consent.fromOwnerId,
    );
    const delegateMembershipId = consent.toMembershipId;

    await this.unitOfWork.execute(async () => {
      await this.consentWriteRepo.updateStatus(
        command.consentId,
        VoteUnitConsentStatus.REVOKED,
      );

      const actor = this.auditContext.requireActor();
      const [voteTitle, unitLabel, ownerLabel, delegateLabel, actorLabel] =
        await Promise.all([
          this.labelResolver.resolveVoteTitle(consent.voteId),
          this.labelResolver.resolveUnitLabel(consent.unitId),
          this.labelResolver.resolveOwnerLabel(consent.fromOwnerId),
          this.labelResolver.resolveMembershipLabel(delegateMembershipId),
          this.labelResolver.resolveActorLabel(actor),
        ]);

      await this.auditService.append(
        VoteConsentRevokedAuditEvent.build({
          voteId: consent.voteId,
          tenantId: consent.tenantId,
          voteTitle,
          consentId: consent.id,
          unitId: consent.unitId,
          unitLabel,
          ownerMembershipId,
          ownerLabel,
          delegateMembershipId,
          delegateLabel,
          revokedByMembershipId: command.membershipId,
          actor,
          actorLabel,
          occurredAt: this.clock.now(),
        }),
      );
    });
  }
}
