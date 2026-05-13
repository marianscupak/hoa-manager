import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';

import type { AuditActor } from '@/modules/core/audit/domain/actor';
import { AUDIT_CLS_KEYS } from '@/modules/core/audit/infrastructure/cls/audit-context.keys';
import { GetMembershipByTenantAndUserQuery } from '@/modules/core/tenancy/application/queries/get-membership-by-tenant-and-user.query';
import { TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import { UnauthorizedException } from '@/shared/application/exceptions/auth.exceptions';
import { AuthClaims } from '@/shared/domain/auth-claims';
import { TenantContext } from '@/shared/domain/tenant-context';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly queryBus: QueryBus,
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

    const membership = await this.queryBus.execute<
      GetMembershipByTenantAndUserQuery,
      TenantMembership | null
    >(new GetMembershipByTenantAndUserQuery(claims.tid, claims.sub));

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

    const existing = this.cls.get<AuditActor | undefined>(AUDIT_CLS_KEYS.actor);
    if (existing && existing.type === 'USER') {
      this.cls.set(AUDIT_CLS_KEYS.actor, {
        type: 'USER',
        userId: existing.userId,
        membershipId: membership.id,
      });
    }

    return true;
  }
}
