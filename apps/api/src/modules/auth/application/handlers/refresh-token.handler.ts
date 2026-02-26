import { randomBytes, createHash } from 'crypto';

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { addDays, differenceInMilliseconds } from 'date-fns';

import {
  InvalidTokenException,
  ReplayAttackException,
  UnauthorizedException,
} from '../../../../shared/application/exceptions/auth.exceptions';
import {
  CLOCK,
  type Clock,
} from '../../../../shared/application/ports/clock.port';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../../shared/application/ports/unit-of-work.port';
import { AuthClaims } from '../../../../shared/domain/auth-claims';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../../../tenancy/application/ports/tenant.repository.port';
import { AuthSession } from '../../domain/auth-identity.entity';
import {
  RefreshTokenCommand,
  type RefreshTokenResult,
} from '../commands/refresh-token.command';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
} from '../ports/auth.repository.port';
import {
  TOKEN_SIGNER,
  TOKEN_VERIFIER,
  type TokenSigner,
  type TokenVerifier,
} from '../ports/auth.utils.port';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand>
{
  private readonly REUSE_GRACE_PERIOD_MS = 30 * 1000;

  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    return this.uow.execute(async () => {
      const oldClaims = await this.verifyOldToken(command.oldAccessToken);
      const userId = oldClaims.sub;

      const session = await this.findAndValidateSession(
        command.refreshToken,
        userId,
      );

      await this.validateSessionStatus(session, userId);

      const scopedClaims = await this.resolveTenantScope(oldClaims, userId);

      await this.authSessionRepository.markRevoked(session.id);
      const { rawToken, hash, expiresAt } = this.generateNewRefreshToken();

      await this.authSessionRepository.create({
        userId,
        refreshTokenHash: hash,
        rotatedFromSessionId: session.id,
        expiresAt,
      });

      const newAccessToken = await this.tokenSigner.signToken(
        scopedClaims,
        15 * 60,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: rawToken,
      };
    });
  }

  private async verifyOldToken(oldAccessToken: string): Promise<AuthClaims> {
    try {
      return await this.tokenVerifier.verifyToken<AuthClaims>(oldAccessToken, {
        ignoreExpiration: true,
      });
    } catch {
      throw new InvalidTokenException();
    }
  }

  private async findAndValidateSession(
    refreshToken: string,
    expectedUserId: string,
  ) {
    const providedHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const session = await this.authSessionRepository.findByHash(providedHash);

    if (!session || session.userId !== expectedUserId) {
      throw new InvalidTokenException();
    }

    return session;
  }

  private async validateSessionStatus(
    session: AuthSession,
    userId: string,
  ): Promise<void> {
    if (session.expiresAt < this.clock.now()) {
      throw new InvalidTokenException();
    }

    if (session.revokedAt) {
      const timeSinceRevoked = differenceInMilliseconds(
        this.clock.now(),
        session.revokedAt,
      );

      if (timeSinceRevoked > this.REUSE_GRACE_PERIOD_MS) {
        await this.authSessionRepository.revokeAllForUser(userId);
        throw new ReplayAttackException();
      } else {
        throw new InvalidTokenException();
      }
    }
  }

  private async resolveTenantScope(
    oldClaims: AuthClaims,
    userId: string,
  ): Promise<AuthClaims> {
    const claims: AuthClaims = { ...oldClaims, sub: userId };

    if (claims.tid) {
      const membership = await this.membershipRepository.findByTenantAndUser(
        claims.tid,
        userId,
      );
      if (!membership || membership.status !== 'ACTIVE') {
        throw new UnauthorizedException();
      }
      claims.roles = [membership.role];
    }

    return claims;
  }

  private generateNewRefreshToken() {
    const rawToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = addDays(this.clock.now(), 30);
    return { rawToken, hash, expiresAt };
  }
}
