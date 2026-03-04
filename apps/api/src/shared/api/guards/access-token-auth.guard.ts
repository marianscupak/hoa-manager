import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';

import { TOKEN_VERIFIER } from '@/modules/auth/application/ports/auth.utils.port';
import type { TokenVerifier } from '@/modules/auth/application/ports/auth.utils.port';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/modules/identity/application/ports/user.repository.port';
import { InvalidTokenException } from '@/shared/application/exceptions/auth.exceptions';
import { UserInactiveException } from '@/shared/application/exceptions/user.exceptions';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { AuthPrincipal } from '@/shared/domain/auth-principal';

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
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

      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
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

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
