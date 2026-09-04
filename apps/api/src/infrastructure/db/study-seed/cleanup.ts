import { eq, like } from 'drizzle-orm';

import * as schema from '@/infrastructure/db/schema';

import { studyEmailLikePattern } from './naming';
import { findPersonaUser } from './persona';
import { type Db, deleteTenants, findTenantIdsOfUser } from './structure';

export interface CleanupSummary {
  tenantsDeleted: number;
  studyUsersDeleted: number;
  participantUserDeleted: boolean;
}

/**
 * Removes everything seeded for one participant:
 * 1. every tenant the persona is a member of (includes the tenant the
 *    participant created by hand in task A1, because the persona created it);
 *    FK cascades take units, owners, votes, ballots, memberships, invites;
 * 2. every user whose email is `pn.<slug>@study.hoa` (persona included;
 *    cascades take identities and sessions);
 * 3. the participant's own account, if given and now without memberships.
 * Audit events have no FK to tenants and are append-only; they stay.
 */
export async function cleanupParticipant(
  db: Db,
  participantId: string,
  participantEmail: string | null,
): Promise<CleanupSummary> {
  return db.transaction(async (tx) => {
    let tenantsDeleted = 0;
    const persona = await findPersonaUser(tx, participantId);
    if (persona) {
      const tenantIds = await findTenantIdsOfUser(tx, persona.id);
      tenantsDeleted = await deleteTenants(tx, tenantIds);
    }

    const studyUsers = await tx
      .delete(schema.users)
      .where(like(schema.users.email, studyEmailLikePattern(participantId)))
      .returning({ id: schema.users.id });

    let participantUserDeleted = false;
    if (participantEmail) {
      const [user] = await tx
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, participantEmail))
        .limit(1);
      if (user) {
        const remaining = await findTenantIdsOfUser(tx, user.id);
        if (remaining.length === 0) {
          await tx.delete(schema.users).where(eq(schema.users.id, user.id));
          participantUserDeleted = true;
        }
      }
    }

    return {
      tenantsDeleted,
      studyUsersDeleted: studyUsers.length,
      participantUserDeleted,
    };
  });
}
