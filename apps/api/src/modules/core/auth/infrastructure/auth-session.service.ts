import { Inject, Injectable } from '@nestjs/common';
import { addDays } from 'date-fns';

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
} from '@/modules/core/auth/application/ports/auth.repository.port';
import {
  TOKEN_SIGNER,
  type TokenSigner,
} from '@/modules/core/auth/application/ports/auth.utils.port';
import { CLOCK, type Clock } from '@/shared/application/ports/clock.port';
import {
  generateToken,
  hashToken,
} from '@/shared/application/utils/token.utils';

export interface CreateSessionResult {
  accessToken: string;
  refreshToken: string;
}

export const AUTH_SESSION_SERVICE = Symbol('AUTH_SESSION_SERVICE');

export interface AuthSessionService {
  createSession(
    userId: string,
    accessTokenPayload: object,
  ): Promise<CreateSessionResult>;
}

@Injectable()
export class AuthSessionServiceImpl implements AuthSessionService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepo: AuthSessionRepository,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async createSession(
    userId: string,
    accessTokenPayload: object,
  ): Promise<CreateSessionResult> {
    const rawRefreshToken = generateToken(32);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = addDays(this.clock.now(), 30);

    await this.authSessionRepo.create({
      userId,
      refreshTokenHash,
      rotatedFromSessionId: null,
      expiresAt,
    });

    const accessToken = await this.tokenSigner.signToken(
      accessTokenPayload,
      15 * 60,
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
