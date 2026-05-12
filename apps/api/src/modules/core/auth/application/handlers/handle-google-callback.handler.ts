import { randomBytes, createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { addDays, addMinutes } from 'date-fns';

import { HandleGoogleCallbackCommand } from '@/modules/core/auth/application/commands/handle-google-callback.command';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  OIDC_LOGIN_ATTEMPT_REPOSITORY,
  AUTH_EXCHANGE_CODE_REPOSITORY,
  type AuthIdentityRepository,
  type AuthSessionRepository,
  type OidcLoginAttemptRepository,
  type AuthExchangeCodeRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import {
  GOOGLE_OIDC_SERVICE,
  type GoogleOidcService,
} from '@/modules/core/auth/application/ports/google-oidc.service.port';
import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { GetMembershipsByUserIdQuery } from '@/modules/core/tenancy/application/queries/get-memberships-by-user-id.query';
import { TenantMembershipStatus } from '@/modules/core/tenancy/domain/tenant.entity';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/shared/application/ports/unit-of-work.port';

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
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
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
        ? await this.queryBus.execute(new GetUserByIdQuery(identity.userId))
        : null;

      if (!identity && !user) {
        user = await this.queryBus.execute(
          new GetUserByEmailQuery(idToken.email!.toLowerCase()),
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
        const userResult = await this.commandBus.execute(
          new CreateUserCommand(
            idToken.email!.toLowerCase(),
            idToken.name ?? idToken.email!,
          ),
        );
        const userId = (userResult as { id: string }).id;

        // Fetch the newly created user to match original logic (which used the created object)
        user = await this.queryBus.execute(new GetUserByIdQuery(userId));

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

      const memberships = await this.queryBus.execute(
        new GetMembershipsByUserIdQuery(user.id),
      );
      const activeMemberships = (memberships as any[]).filter(
        (m) => m.status === TenantMembershipStatus.ACTIVE,
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
