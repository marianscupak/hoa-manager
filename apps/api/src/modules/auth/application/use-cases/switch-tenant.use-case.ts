import { Injectable, Inject } from '@nestjs/common';

import {
  UnauthorizedException,
  InvalidTokenException,
} from '../../../../shared/application/exceptions/auth.exceptions';
import { UNIT_OF_WORK } from '../../../../shared/application/ports/unit-of-work.port';
import type { UnitOfWork } from '../../../../shared/application/ports/unit-of-work.port';
import { AuthClaims } from '../../../../shared/domain/auth-claims';
import { MEMBERSHIP_REPOSITORY } from '../../../tenancy/application/ports/tenant.repository.port';
import type { MembershipRepository } from '../../../tenancy/application/ports/tenant.repository.port';
import { TOKEN_SIGNER, TOKEN_VERIFIER } from '../ports/auth.utils.port';
import type { TokenSigner, TokenVerifier } from '../ports/auth.utils.port';

export interface SwitchTenantCommand {
  accessToken: string;
  targetTenantId: string;
}

export interface SwitchTenantResult {
  accessToken: string;
}

@Injectable()
export class SwitchTenantUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
    @Inject(TOKEN_SIGNER) private readonly tokenSigner: TokenSigner,
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
  ) {}

  async execute(command: SwitchTenantCommand): Promise<SwitchTenantResult> {
    return this.uow.execute(async () => {
      let claims: AuthClaims;
      try {
        claims = await this.tokenVerifier.verifyToken<AuthClaims>(
          command.accessToken,
        );
      } catch {
        throw new InvalidTokenException();
      }

      const userId = claims.sub;

      const membership = await this.membershipRepository.findByTenantAndUser(
        command.targetTenantId,
        userId,
      );

      if (!membership || membership.status !== 'ACTIVE') {
        throw new UnauthorizedException();
      }

      const newPayload = {
        sub: userId,
        tid: membership.tenantId,
        mid: membership.id,
        roles: [membership.role],
      };

      const newAccessToken = await this.tokenSigner.signToken(
        newPayload,
        15 * 60,
      );

      return {
        accessToken: newAccessToken,
      };
    });
  }
}
