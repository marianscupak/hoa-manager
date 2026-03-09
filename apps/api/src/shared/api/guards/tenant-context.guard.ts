import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';

import { MEMBERSHIP_REPOSITORY } from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import type { MembershipRepository } from '@/modules/core/tenancy/application/ports/tenant.repository.port';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantContext } from '@/shared/domain/tenant-context';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { authClaims?: AuthClaims; tenant?: TenantContext }
      >();
    const claims = request.authClaims;

    if (!claims) {
      throw new UnauthorizedException();
    }

    if (!claims.tid || !claims.mid) {
      throw new UnauthorizedException();
    }

    const membership = await this.membershipRepository.findByTenantAndUser(
      claims.tid,
      claims.sub,
    );

    if (!membership || membership.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }

    const tenantContext: TenantContext = {
      tenantId: membership.tenantId,
      membershipId: membership.id,
      roles: [membership.role],
      membershipStatus: membership.status,
    };

    request.tenant = tenantContext;
    request.authClaims!.roles = [membership.role];

    return true;
  }
}
