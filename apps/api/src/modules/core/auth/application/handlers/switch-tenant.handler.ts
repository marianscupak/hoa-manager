import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import {
  SwitchTenantCommand,
  type SwitchTenantResult,
} from '@/modules/core/auth/application/commands/switch-tenant.command';
import { type GetUserByIdResult } from '@/modules/core/identity/application/handlers/get-user-by-id.handler';
import { GetUserByIdQuery } from '@/modules/core/identity/application/queries/get-user-by-id.query';
import { GetMembershipByTenantAndUserQuery } from '@/modules/core/tenancy/application/queries/get-membership-by-tenant-and-user.query';
import { TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import {
  InvalidTokenException,
  UnauthorizedException,
} from '@/shared/application/exceptions/auth.exceptions';
import { UserInactiveException } from '@/shared/application/exceptions/user.exceptions';
import {
  TOKEN_SIGNER,
  TOKEN_VERIFIER,
  type TokenSigner,
  type TokenVerifier,
} from '@/shared/application/ports/token.port';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantMembershipStatus } from '@/shared/domain/membership';

@CommandHandler(SwitchTenantCommand)
export class SwitchTenantHandler
  implements ICommandHandler<SwitchTenantCommand>
{
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: SwitchTenantCommand): Promise<SwitchTenantResult> {
    let claims: AuthClaims;
    try {
      claims = await this.tokenVerifier.verifyToken<AuthClaims>(
        command.accessToken,
      );
    } catch {
      throw new InvalidTokenException();
    }

    const user = await this.queryBus.execute<
      GetUserByIdQuery,
      GetUserByIdResult
    >(new GetUserByIdQuery(claims.sub));

    if (!user || !user.isActive) {
      throw new UserInactiveException();
    }

    const membership = await this.queryBus.execute<
      GetMembershipByTenantAndUserQuery,
      TenantMembership | null
    >(
      new GetMembershipByTenantAndUserQuery(command.targetTenantId, claims.sub),
    );

    if (!membership || membership.status !== TenantMembershipStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const newClaims: AuthClaims = {
      sub: claims.sub,
      email: user.email,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      tid: command.targetTenantId,
      mid: membership.id,
      roles: [membership.role],
    };

    const newAccessToken = await this.tokenSigner.signToken(newClaims, 15 * 60);

    return {
      accessToken: newAccessToken,
    };
  }
}
