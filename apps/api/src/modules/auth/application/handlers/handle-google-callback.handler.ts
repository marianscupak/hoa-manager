import { randomBytes, createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { addDays, addMinutes } from 'date-fns';

import { UnauthorizedException } from '../../../../shared/application/exceptions/auth.exceptions';
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
import { HandleGoogleCallbackCommand } from '../commands/handle-google-callback.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  OIDC_LOGIN_ATTEMPT_REPOSITORY,
  AUTH_EXCHANGE_CODE_REPOSITORY,
  type AuthIdentityRepository,
  type AuthSessionRepository,
  type OidcLoginAttemptRepository,
  type AuthExchangeCodeRepository,
} from '../ports/auth.repository.port';
import {
  GOOGLE_OIDC_SERVICE,
  type GoogleOidcService,
} from '../ports/google-oidc.service.port';

export interface HandleGoogleCallbackResult {
  refreshToken: string;
  redirectUrl: string;
}

@CommandHandler(HandleGoogleCallbackCommand)
export class HandleGoogleCallbackHandler
  implements ICommandHandler<HandleGoogleCallbackCommand>
{
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepository: AuthIdentityRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(OIDC_LOGIN_ATTEMPT_REPOSITORY)
    private readonly attemptRepository: OidcLoginAttemptRepository,
    @Inject(AUTH_EXCHANGE_CODE_REPOSITORY)
    private readonly exchangeCodeRepository: AuthExchangeCodeRepository,
    @Inject(GOOGLE_OIDC_SERVICE)
    private readonly googleOidcService: GoogleOidcService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: HandleGoogleCallbackCommand,
  ): Promise<HandleGoogleCallbackResult> {
    const stateHash = createHash('sha256').update(command.state).digest('hex');
    const attempt = await this.attemptRepository.findByStateHash(stateHash);

    if (!attempt) {
      throw new UnauthorizedException();
    }

    if (attempt.expiresAt < this.clock.now()) {
      await this.attemptRepository.delete(attempt.id);
      throw new UnauthorizedException();
    }

    await this.attemptRepository.delete(attempt.id);

    const tokenPayload = await this.googleOidcService.exchangeCode(
      command.code,
      attempt.nonce,
    );
    const idToken = tokenPayload.idTokenPayload;

    if (!idToken.email || !idToken.email_verified) {
      throw new UnauthorizedException();
    }

    return this.uow.execute(async () => {
      let identity = await this.authIdentityRepository.findByProvider(
        'OIDC_GOOGLE',
        idToken.sub,
      );
      let user = identity
        ? await this.userRepository.findById(identity.userId)
        : null;

      if (!identity && !user) {
        user = await this.userRepository.findByEmail(
          idToken.email!.toLowerCase(),
        );

        if (user) {
          identity = await this.authIdentityRepository.create({
            userId: user.id,
            provider: 'OIDC_GOOGLE',
            providerSubject: idToken.sub,
            passwordHash: null,
          });
        }
      }

      if (!user) {
        user = await this.userRepository.create({
          email: idToken.email!.toLowerCase(),
          fullName: idToken.name ?? idToken.email!,
          isEmailVerified: true,
          isActive: true,
        });

        identity = await this.authIdentityRepository.create({
          userId: user.id,
          provider: 'OIDC_GOOGLE',
          providerSubject: idToken.sub,
          passwordHash: null,
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException();
      }

      await this.authIdentityRepository.updateLastUsed(identity!.id);

      const memberships = await this.membershipRepository.findByUserId(user.id);
      const activeMemberships = memberships.filter(
        (m) => m.status === 'ACTIVE',
      );

      let tenantId: string | null = null;
      let membershipId: string | null = null;
      let roles: string[] | null = null;

      if (activeMemberships.length === 1) {
        tenantId = activeMemberships[0]!.tenantId;
        membershipId = activeMemberships[0]!.id;
        roles = [activeMemberships[0]!.role];
      }

      const rawRefreshToken = randomBytes(32).toString('hex');
      const refreshTokenHash = createHash('sha256')
        .update(rawRefreshToken)
        .digest('hex');

      await this.authSessionRepository.create({
        userId: user.id,
        refreshTokenHash,
        rotatedFromSessionId: null,
        expiresAt: addDays(this.clock.now(), 30),
      });

      const rawExchangeCode = randomBytes(32).toString('hex');
      const codeHash = createHash('sha256')
        .update(rawExchangeCode)
        .digest('hex');

      await this.exchangeCodeRepository.create({
        codeHash,
        userId: user.id,
        tenantId,
        membershipId,
        roles,
        expiresAt: addMinutes(this.clock.now(), 5),
      });

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/google/callback?code=${rawExchangeCode}`;

      return {
        refreshToken: rawRefreshToken,
        redirectUrl,
      };
    });
  }
}
