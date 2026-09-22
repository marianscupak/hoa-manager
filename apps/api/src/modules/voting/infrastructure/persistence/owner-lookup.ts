import { and, eq, inArray } from 'drizzle-orm';

import { type DrizzleService } from '@/infrastructure/db/drizzle.service';
import { owners, tenantMemberships } from '@/infrastructure/db/schema';

type Db = DrizzleService['db'];

/**
 * Which owner each membership's user is in the tenant, for the memberships
 * given. `owners` has UNIQUE (tenant_id, user_id), so a membership maps to at
 * most one owner. Used to canonicalize consent targets and to find the owner
 * behind a caller.
 */
export async function findOwnerIdsByMembershipIds(
  db: Db,
  tenantId: string,
  membershipIds: string[],
): Promise<Map<string, string>> {
  if (membershipIds.length === 0) return new Map();
  const rows = await db
    .select({ membershipId: tenantMemberships.id, ownerId: owners.id })
    .from(tenantMemberships)
    .innerJoin(
      owners,
      and(
        eq(owners.userId, tenantMemberships.userId),
        eq(owners.tenantId, tenantMemberships.tenantId),
      ),
    )
    .where(
      and(
        eq(tenantMemberships.tenantId, tenantId),
        inArray(tenantMemberships.id, membershipIds),
      ),
    );
  return new Map(rows.map((r) => [r.membershipId, r.ownerId]));
}
