import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  InvalidTokenException,
  UnauthorizedException,
} from '../../../../shared/application/exceptions/auth.exceptions';
import { UserInactiveException } from '../../../../shared/application/exceptions/user.exceptions';
import { AuthClaims } from '../../../../shared/domain/auth-claims';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../identity/application/ports/user.repository.port';
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../../../tenancy/application/ports/tenant.repository.port';
import {
  SwitchTenantCommand,
  type SwitchTenantResult,
} from '../commands/switch-tenant.command';
import {
  TOKEN_SIGNER,
  TOKEN_VERIFIER,
  type TokenSigner,
  type TokenVerifier,
} from '../ports/auth.utils.port';

@CommandHandler(SwitchTenantCommand)
export class SwitchTenantHandler implements ICommandHandler<SwitchTenantCommand> {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
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

    const user = await this.userRepository.findById(claims.sub);
    if (!user || !user.isActive) {
      throw new UserInactiveException();
    }

    const membership = await this.membershipRepository.findByTenantAndUser(
      command.targetTenantId,
      claims.sub,
    );

    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    const newClaims: AuthClaims = {
      sub: claims.sub,
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
