import { sql, type SQL } from 'drizzle-orm';

import {
  owners,
  tenantMemberships,
  voteElectorateUnits,
} from '@/infrastructure/db/schema';

/**
 * Which account may cast for a snapshot row **now**: the stored membership of
 * a non-owner delegate, else the ACTIVE membership of the user currently
 * linked to the representative owner, else null (paper only). Evaluated at
 * read time on purpose — an owner who gets an account during an open vote can
 * cast in the app from that moment. Must agree with the domain twin
 * `channelMembershipIdFromParties`.
 *
 * Use only in queries whose FROM includes `vote_electorate_units` unaliased.
 */
export function channelMembershipIdSql(): SQL<string | null> {
  return sql<string | null>`coalesce(
    ${voteElectorateUnits.representativeMembershipId},
    (select m.id
       from ${owners} o
       join ${tenantMemberships} m
         on m.user_id = o.user_id and m.tenant_id = o.tenant_id
      where o.id = ${voteElectorateUnits.representativeOwnerId}
        and m.status = 'ACTIVE'
      limit 1)
  )`;
}
