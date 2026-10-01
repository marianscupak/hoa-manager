import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetMembershipByTenantAndUserQuery } from '@/modules/core/tenancy/application/queries/get-membership-by-tenant-and-user.query';
import type { TenantMembership } from '@/modules/core/tenancy/domain/tenant.entity';
import type {
  MembershipAccess,
  MembershipAccessLookup,
} from '@/shared/application/ports/membership-access.port';

/**
 * Tenancy's answer to the shared tenant context guard. It asks through the
 * module's own query so the lookup logic stays in one place.
 */
@Injectable()
export class QueryBusMembershipAccessLookup implements MembershipAccessLookup {
  constructor(private readonly queryBus: QueryBus) {}

  async findMembership(
    tenantId: string,
    userId: string,
  ): Promise<MembershipAccess | null> {
    const membership = await this.queryBus.execute<
      GetMembershipByTenantAndUserQuery,
      TenantMembership | null
    >(new GetMembershipByTenantAndUserQuery(tenantId, userId));

    if (!membership) {
      return null;
    }

    return {
      id: membership.id,
      tenantId: membership.tenantId,
      role: membership.role,
      status: membership.status,
    };
  }
}
