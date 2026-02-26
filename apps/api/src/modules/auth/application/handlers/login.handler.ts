import { randomBytes, createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { addDays } from 'date-fns';

import {
  UnauthorizedException,
  InvalidCredentialsException,
} from '../../../../shared/application/exceptions/auth.exceptions';
import {
  CLOCK,
  type Clock,
} from '../../../../shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../../shared/application/ports/unit-of-work.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/application/ports/user.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../../../tenancy/application/ports/tenant.repository.port';
import { LoginCommand, type LoginResult } from '../commands/login.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  type AuthIdentityRepository,
  type AuthSessionRepository,
} from '../ports/auth.repository.port';
import {
  PASSWORD_HASHER,
  TOKEN_SIGNER,
  type PasswordHasher,
  type TokenSigner,
} from '../ports/auth.utils.port';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepository: AuthIdentityRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    return this.uow.execute(async () => {
      const user = await this.userRepository.findByEmail(command.email);
      if (!user) {
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
        throw new InvalidCredentialsException();
      }

      if (command.provider === 'LOCAL') {
        if (!command.password || !identity.passwordHash) {
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

      const memberships = await this.membershipRepository.findByUserId(user.id);
      const activeMemberships = memberships.filter(
        (m) => m.status === 'ACTIVE',
      );

      let tenantId: string | undefined;
      let membershipId: string | undefined;
      let roles: string[] = [];

      if (activeMemberships.length === 1) {
        tenantId = activeMemberships[0]!.tenantId;
        membershipId = activeMemberships[0]!.id;
        roles = [activeMemberships[0]!.role];
      }

      const accessTokenPayload = {
        sub: user.id,
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
