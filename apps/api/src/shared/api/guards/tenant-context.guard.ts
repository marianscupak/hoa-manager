import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';

import { ACTOR_CLS_KEY } from '@/shared/application/actor-context';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';
import {
  MEMBERSHIP_ACCESS_LOOKUP,
  type MembershipAccessLookup,
} from '@/shared/application/ports/membership-access.port';
import type { AuditActor } from '@/shared/domain/actor';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantContext } from '@/shared/domain/tenant-context';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    @Inject(MEMBERSHIP_ACCESS_LOOKUP)
    private readonly memberships: MembershipAccessLookup,
    private readonly cls: ClsService,
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

    const membership = await this.memberships.findMembership(
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

    const existing = this.cls.get<AuditActor | undefined>(ACTOR_CLS_KEY);
    if (existing && existing.type === 'USER') {
      this.cls.set(ACTOR_CLS_KEY, {
        type: 'USER',
        userId: existing.userId,
        membershipId: membership.id,
      });
    }

    return true;
  }
}
