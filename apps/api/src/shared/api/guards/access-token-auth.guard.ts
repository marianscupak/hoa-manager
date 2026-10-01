import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';

import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';
import { InvalidTokenException } from '@/shared/application/exceptions/auth.exceptions';
import { UserInactiveException } from '@/shared/application/exceptions/user.exceptions';
import type { TokenVerifier } from '@/shared/application/ports/token.port';
import { TOKEN_VERIFIER } from '@/shared/application/ports/token.port';
import {
  USER_ACCESS_LOOKUP,
  type UserAccessLookup,
} from '@/shared/application/ports/user-access.port';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { AuthPrincipal } from '@/shared/domain/auth-principal';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    @Inject(USER_ACCESS_LOOKUP)
    private readonly userAccess: UserAccessLookup,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: AuthPrincipal; authClaims?: AuthClaims }
      >();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new InvalidTokenException();
    }

    try {
      const payload = await this.tokenVerifier.verifyToken<AuthClaims>(token);

      const user = await this.userAccess.findUserAccess(payload.sub);

      if (!user) {
        throw new InvalidTokenException();
      }
      if (!user.isActive) {
        throw new UserInactiveException();
      }

      const principal: AuthPrincipal = {
        userId: payload.sub,
        subject: payload.sub,
        authMethod: 'JWT',
      };

      request['user'] = principal;
      request['authClaims'] = payload;
    } catch (err) {
      if (err instanceof UserInactiveException) {
        throw err;
      }
      throw new InvalidTokenException();
    }

    this.cls.set(ACTOR_CLS_KEY, {
      type: 'USER',
      userId: request['user']!.userId,
      membershipId: null,
    });

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
