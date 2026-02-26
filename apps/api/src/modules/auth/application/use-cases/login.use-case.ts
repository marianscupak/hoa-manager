import { randomBytes, createHash } from 'crypto';

import { Injectable, Inject } from '@nestjs/common';

import {
  UnauthorizedException,
  InvalidCredentialsException,
} from '../../../../shared/application/exceptions/auth.exceptions';
import { UNIT_OF_WORK } from '../../../../shared/application/ports/unit-of-work.port';
import type { UnitOfWork } from '../../../../shared/application/ports/unit-of-work.port';
import { USER_REPOSITORY } from '../../../identity/application/ports/user.repository.port';
import type { UserRepository } from '../../../identity/application/ports/user.repository.port';
import { MEMBERSHIP_REPOSITORY } from '../../../tenancy/application/ports/tenant.repository.port';
import type { MembershipRepository } from '../../../tenancy/application/ports/tenant.repository.port';
import {
  AUTH_IDENTITY_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
} from '../ports/auth.repository.port';
import type {
  AuthIdentityRepository,
  AuthSessionRepository,
} from '../ports/auth.repository.port';
import { PASSWORD_HASHER, TOKEN_SIGNER, CLOCK } from '../ports/auth.utils.port';
import type {
  PasswordHasher,
  TokenSigner,
  Clock,
} from '../ports/auth.utils.port';

export interface LoginCommand {
  email: string;
  password?: string;
  provider: 'LOCAL' | 'OIDC_GOOGLE';
  providerSubject?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
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

      const expiresAt = new Date(
        this.clock.now().getTime() + 30 * 24 * 60 * 60 * 1000,
      ); // 30 days

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
