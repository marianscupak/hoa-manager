import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  InviteNotFoundException,
  InviteExpiredException,
  InviteAlreadyAcceptedException,
  OwnerAlreadyClaimedException,
  AccountExistsException,
} from '../../../../shared/application/exceptions/invite.exceptions';
import {
  CLOCK,
  type Clock,
} from '../../../../shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../../shared/application/ports/unit-of-work.port';
import { hashToken } from '../../../../shared/application/utils/token.utils';
import {
  AUTH_IDENTITY_REPOSITORY,
  type AuthIdentityRepository,
} from '../../../auth/application/ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../auth/application/ports/auth.utils.port';
import {
  AUTH_SESSION_SERVICE,
  type AuthSessionService,
} from '../../../auth/infrastructure/auth-session.service';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/application/ports/user.repository.port';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '../../../property/application/ports/property.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../../../tenancy/application/ports/tenant.repository.port';
import { TenantMembershipRole } from '../../../tenancy/domain/tenant.entity';
import { RegisterFromInviteCommand } from '../commands/register-from-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '../ports/owner-invite.repository.port';

export interface RegisterFromInviteResult {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
}

@CommandHandler(RegisterFromInviteCommand)
export class RegisterFromInviteHandler
  implements ICommandHandler<RegisterFromInviteCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(OWNER_INVITE_REPOSITORY)
    private readonly inviteRepo: OwnerInviteRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepo: OwnerRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepo: AuthIdentityRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(AUTH_SESSION_SERVICE)
    private readonly authSessionService: AuthSessionService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    command: RegisterFromInviteCommand,
  ): Promise<RegisterFromInviteResult> {
    return this.uow.execute(async () => {
      const tokenHash = hashToken(command.rawToken);

      const invite = await this.inviteRepo.findByTokenHash(tokenHash);
      if (!invite) {
        throw new InviteNotFoundException();
      }

      if (invite.acceptedAt) {
        throw new InviteAlreadyAcceptedException();
      }

      const now = this.clock.now();
      if (invite.expiresAt < now) {
        throw new InviteExpiredException();
      }

      // Load owner
      const owner = await this.ownerRepo.findById(
        invite.tenantId,
        invite.ownerId,
      );
      if (!owner) {
        throw new InviteNotFoundException();
      }

      if (owner.userId) {
        throw new OwnerAlreadyClaimedException();
      }

      // Check if user already exists
      const existingUser = await this.userRepo.findByEmail(
        invite.emailNormalized,
      );
      if (existingUser) {
        throw new AccountExistsException();
      }

      // Create user (email is verified because possession of invite token proves mailbox control)
      const user = await this.userRepo.create({
        email: invite.emailNormalized,
        fullName: owner.displayName,
        isEmailVerified: true,
        isActive: true,
      });

      // Create LOCAL auth identity
      const passwordHash = await this.passwordHasher.hash(command.password);
      await this.authIdentityRepo.create({
        userId: user.id,
        provider: 'LOCAL' as const,
        providerSubject: invite.emailNormalized,
        passwordHash,
      });

      // Link owner
      await this.ownerRepo.setUserId(invite.tenantId, invite.ownerId, user.id);

      // Create membership
      const membership = await this.membershipRepo.create({
        tenantId: invite.tenantId,
        userId: user.id,
        role: TenantMembershipRole.UNIT_OWNER,
        status: 'ACTIVE',
      });

      // Mark invite accepted
      await this.inviteRepo.markAccepted(invite.id, now);

      // Create auth session with tenant-scoped token
      const session = await this.authSessionService.createSession(user.id, {
        sub: user.id,
        tid: invite.tenantId,
        mid: membership.id,
        roles: [TenantMembershipRole.UNIT_OWNER],
      });

      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        tenantId: invite.tenantId,
      };
    });
  }
}
