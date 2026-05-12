import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { CreateAuthIdentityCommand } from '@/modules/core/auth/application/commands/create-auth-identity.command';
import { CreateSessionCommand } from '@/modules/core/auth/application/commands/create-session.command';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@/modules/core/auth/application/ports/auth.utils.port';
import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { RegisterFromInviteCommand } from '@/modules/core/invitation/application/commands/register-from-invite.command';
import {
  OWNER_INVITE_REPOSITORY,
  type OwnerInviteRepository,
} from '@/modules/core/invitation/application/ports/owner-invite.repository.port';
import { SetOwnerUserIdCommand } from '@/modules/core/property/application/commands/set-owner-user-id.command';
import { GetOwnerByIdQuery } from '@/modules/core/property/application/queries/get-owner-by-id.query';
import { CreateMembershipCommand } from '@/modules/core/tenancy/application/commands/create-membership.command';
import {
  TenantMembershipRole,
  TenantMembershipStatus,
} from '@/modules/core/tenancy/domain/tenant.entity';
import {
  InviteNotFoundException,
  InviteExpiredException,
  InviteAlreadyAcceptedException,
  OwnerAlreadyClaimedException,
  AccountExistsException,
} from '@/shared/application/exceptions/invite.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';
import { hashToken } from '@/shared/application/utils/token.utils';

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
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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

      // Load owner (Property)
      const owner = await this.queryBus.execute(
        new GetOwnerByIdQuery(invite.tenantId, invite.ownerId),
      );
      if (!owner) {
        throw new InviteNotFoundException();
      }

      if (owner.userId) {
        throw new OwnerAlreadyClaimedException();
      }

      // Check if user already exists (Identity)
      const existingUser = await this.queryBus.execute(
        new GetUserByEmailQuery(invite.emailNormalized),
      );
      if (existingUser) {
        throw new AccountExistsException();
      }

      // Create user (Identity)
      const userResult = await this.commandBus.execute(
        new CreateUserCommand(invite.emailNormalized, owner.displayName),
      );
      const userId = (userResult as { id: string }).id;

      // Create LOCAL auth identity (Auth)
      const passwordHash = await this.passwordHasher.hash(command.password);
      await this.commandBus.execute(
        new CreateAuthIdentityCommand(
          userId,
          'LOCAL',
          invite.emailNormalized,
          passwordHash,
        ),
      );

      // Link owner (Property)
      await this.commandBus.execute(
        new SetOwnerUserIdCommand(invite.tenantId, invite.ownerId, userId),
      );

      // Create membership (Tenancy)
      const membership = await this.commandBus.execute(
        new CreateMembershipCommand(
          invite.tenantId,
          userId,
          TenantMembershipRole.UNIT_OWNER,
          TenantMembershipStatus.ACTIVE,
        ),
      );

      const membershipId = (membership as { id: string }).id;

      // Mark invite accepted (Local)
      await this.inviteRepo.markAccepted(invite.id, now);

      // Create auth session with tenant-scoped token (Auth)
      const session = await this.commandBus.execute(
        new CreateSessionCommand(
          userId,
          invite.emailNormalized,
          owner.displayName,
          'cs', // Default, maybe should come from somewhere
          invite.tenantId,
          membershipId,
          [TenantMembershipRole.UNIT_OWNER],
        ),
      );

      const sessionResult = session as {
        accessToken: string;
        refreshToken: string;
      };

      return {
        accessToken: sessionResult.accessToken,
        refreshToken: sessionResult.refreshToken,
        tenantId: invite.tenantId,
      };
    });
  }
}
