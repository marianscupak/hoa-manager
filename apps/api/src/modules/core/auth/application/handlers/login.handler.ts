import { randomBytes, createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { addDays } from 'date-fns';

import {
  LoginCommand,
  type LoginResult,
} from '@/modules/core/auth/application/commands/login.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  type AuthIdentityRepository,
  type AuthSessionRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  TOKEN_SIGNER,
  type PasswordHasher,
  type TokenSigner,
} from '@/modules/core/auth/application/ports/auth.utils.port';
import { resolveAutoScope } from '@/modules/core/auth/application/resolve-auto-scope';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { GetMembershipsByUserIdQuery } from '@/modules/core/tenancy/application/queries/get-memberships-by-user-id.query';
import { type TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import {
  UnauthorizedException,
  InvalidCredentialsException,
} from '@/shared/application/exceptions/auth.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepository: AuthIdentityRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    return this.uow.execute(async () => {
      const user = await this.queryBus.execute(
        new GetUserByEmailQuery(command.email),
      );
      if (!user) {
        // Equalise timing with the bcrypt-compare path to prevent
        // user enumeration via login response time.
        await this.passwordHasher.compareDummy(command.password ?? '');
        throw new InvalidCredentialsException();
      }

      if (!user.isActive) {
        throw new UnauthorizedException();
      }

      const subject =
        command.provider === 'LOCAL' ? command.email : command.providerSubject!;
      const identity = await this.authIdentityRepository.findByProvider(
        command.provider,
        subject,
      );

      if (!identity || identity.userId !== user.id) {
        if (command.provider === 'LOCAL') {
          await this.passwordHasher.compareDummy(command.password ?? '');
        }
        throw new InvalidCredentialsException();
      }

      if (command.provider === 'LOCAL') {
        if (!command.password || !identity.passwordHash) {
          await this.passwordHasher.compareDummy(command.password ?? '');
          throw new InvalidCredentialsException();
        }
        const isValid = await this.passwordHasher.compare(
          command.password,
          identity.passwordHash,
        );
        if (!isValid) {
          throw new InvalidCredentialsException();
        }
      }

      await this.authIdentityRepository.updateLastUsed(identity.id);

      const memberships = await this.queryBus.execute(
        new GetMembershipsByUserIdQuery(user.id),
      );
      const scoped = resolveAutoScope(memberships as TenantMembership[]);

      let tenantId: string | undefined;
      let membershipId: string | undefined;
      let roles: string[] = [];

      if (scoped) {
        tenantId = scoped.tenantId;
        membershipId = scoped.id;
        roles = [scoped.role];
      }

      const accessTokenPayload = {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
        ...(tenantId ? { tid: tenantId, mid: membershipId, roles } : {}),
      };

      // TODO: Configurable TTL
      const accessToken = await this.tokenSigner.signToken(
        accessTokenPayload,
        15 * 60,
      ); // 15 minutes

      const rawRefreshToken = randomBytes(32).toString('hex');
      const refreshTokenHash = createHash('sha256')
        .update(rawRefreshToken)
        .digest('hex');

      const expiresAt = addDays(this.clock.now(), 30);

      await this.authSessionRepository.create({
        userId: user.id,
        refreshTokenHash,
        rotatedFromSessionId: null,
        expiresAt,
      });

      return {
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }
}
