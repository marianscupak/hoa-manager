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
import { resolveAutoScope } from '@/modules/core/auth/application/resolve-auto-scope';
import { CreateUserCommand } from '@/modules/core/identity/application/commands/create-user.command';
import { MarkEmailVerifiedCommand } from '@/modules/core/identity/application/commands/mark-email-verified.command';
import { GetUserByEmailQuery } from '@/modules/core/identity/application/queries/get-user-by-email.query';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { GetMembershipsByUserIdQuery } from '@/modules/core/tenancy/application/queries/get-memberships-by-user-id.query';
import { type TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import { decideIdentityLink } from '@/modules/core/auth/domain/link-identity';
import {
  IdentityAlreadyLinkedException,
  IdentityEmailMismatchException,
  UnauthorizedException,
} from '@/shared/application/exceptions/auth.exceptions';
import { AccountExistsException } from '@/shared/application/exceptions/invite.exceptions';
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
    const { code, state } = command.query;

    if (!code || !state) {
      throw new UnauthorizedException();
    }

    const stateHash = createHash('sha256').update(state).digest('hex');
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
      command.query,
      attempt.nonce,
      state,
    );

    const idToken = tokenPayload.idTokenPayload;

    if (!idToken.email || !idToken.email_verified) {
      throw new UnauthorizedException();
    }

    if (attempt.purpose === 'LINK') {
      return this.linkToAccount(attempt.userId, idToken);
    }

    return this.uow.execute(async () => {
      let identity = await this.authIdentityRepository.findByProvider(
        'OIDC_GOOGLE',
        idToken.sub,
      );
      let user = identity
        ? await this.queryBus.execute(new GetUserByIdQuery(identity.userId))
        : null;

      if (!identity) {
        // Refuse to silently link Google to an existing email-based
        // account. The user must sign in via their existing provider
        // and explicitly link Google from settings.
        const existingByEmail = await this.queryBus.execute(
          new GetUserByEmailQuery(idToken.email!.toLowerCase()),
        );
        if (existingByEmail) {
          throw new AccountExistsException();
        }
      }

      if (!user) {
        const userResult = await this.commandBus.execute(
          new CreateUserCommand(
            idToken.email!.toLowerCase(),
            idToken.name ?? idToken.email!,
            // Google refused this login above unless it had verified the
            // address, so it is proven by the time we get here.
            true,
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

      // Accounts created before the flag was carried across still sit at
      // false, which blocks them from accepting an owner invite. Setting it
      // on every login repairs them; the command is a no-op once it is true.
      await this.commandBus.execute(new MarkEmailVerifiedCommand(user.id));

      await this.authIdentityRepository.updateLastUsed(identity!.id);

      const memberships = await this.queryBus.execute(
        new GetMembershipsByUserIdQuery(user.id),
      );
      const scoped = resolveAutoScope(memberships as TenantMembership[]);

      let tenantId: string | null = null;
      let membershipId: string | null = null;
      let roles: string[] | null = null;

      if (scoped) {
        tenantId = scoped.tenantId;
        membershipId = scoped.id;
        roles = [scoped.role];
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

  /**
   * Attaches Google to an account that is already signed in. It never creates
   * a user, never issues a session and never reads the account out of the
   * token — the account comes from the attempt, which only an authenticated
   * caller could have started.
   */
  private async linkToAccount(
    userId: string | null,
    idToken: { sub: string; email?: string; email_verified?: boolean },
  ): Promise<HandleGoogleCallbackResult> {
    if (!userId) {
      // `purpose` and `userId` are written together, so this can only mean
      // the row was tampered with.
      throw new UnauthorizedException();
    }

    const account = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!account || !account.isActive) {
      throw new UnauthorizedException();
    }

    const existing = await this.authIdentityRepository.findByProvider(
      'OIDC_GOOGLE',
      idToken.sub,
    );

    const decision = decideIdentityLink({
      account: { id: account.id, email: account.email },
      googleEmail: idToken.email ?? '',
      emailVerified: !!idToken.email_verified,
      identityOwnerId: existing?.userId ?? null,
    });

    if (decision.outcome === 'REFUSE') {
      switch (decision.reason) {
        case 'EMAIL_MISMATCH':
          throw new IdentityEmailMismatchException();
        case 'IDENTITY_ALREADY_LINKED':
          throw new IdentityAlreadyLinkedException();
        case 'EMAIL_NOT_VERIFIED':
          throw new UnauthorizedException();
      }
    }

    if (decision.outcome === 'LINK') {
      await this.authIdentityRepository.create({
        userId: account.id,
        provider: 'OIDC_GOOGLE',
        providerSubject: idToken.sub,
        passwordHash: null,
      });
    }

    return {
      refreshToken: '',
      redirectUrl: `${this.configService.get<string>('FRONTEND_URL')}/profile?linked=google`,
    };
  }
}
